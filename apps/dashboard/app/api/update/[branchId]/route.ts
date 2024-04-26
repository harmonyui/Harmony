import { ComponentUpdate } from '@harmony/ui/src/types/component';
import { prisma } from '@harmony/db/lib/prisma';
import { getFileContent } from '@harmony/server/src/api/services/indexor/github';
import { GithubRepository } from '@harmony/server/src/api/repository/github';

import { UpdateResponse, updateRequestBodySchema, updateResponseSchema } from '@harmony/ui/src/types/network';
import { indexFilesAndFollowImports } from '@harmony/server/src/api/services/indexor/indexor';
import { getRepository } from '@harmony/server/src/api/routers/branch';
import { Repository } from '@harmony/ui/src/types/branch';
import { getLocationFromComponentId, reverseUpdates } from '@harmony/util/src';

export const maxDuration = 300;
export async function POST(req: Request, {params}: {params: {branchId: string}}): Promise<Response> {
	const {branchId} = params;

	const branch = await prisma.branch.findUnique({
		where: {
			id: branchId
		}
	});
	if (branch === null) {
		throw new Error("Cannot find branch with id " + branchId);
	}

	const pullRequest = await prisma.pullRequest.findUnique({
		where: {
			branch_id: branchId
		}
	})

	if (pullRequest) {
		throw new Error("Cannot make changes on a published branch");
	}

	const repository = await getRepository({prisma, repositoryId: branch.repository_id});
	if (!repository) {
		throw new Error("Cannot find repository with id " + branch.repository_id)
	}

	const accountTiedToBranch = await prisma.account.findFirst({
		where: {
			branch: {
				some: {
					id: branchId
				}
			}
		}
	});

	if (!accountTiedToBranch) {
		throw new Error("Cannot find account tied to branch " + branchId);
	}

	const json = await req.json();
	const parseResult = updateRequestBodySchema.safeParse(json);
	if (!parseResult.success) {
		throw new Error("Invalid parsing");
	}
	const body = parseResult.data;

	await prisma.account.update({
		where: {
			id: accountTiedToBranch.id
		},
		data: {
			seen_welcome_screen: true
		}
	})

	const updates: ComponentUpdate[] = [];
	const errorUpdates: (ComponentUpdate & {errorType: string})[] = [];
	//Indexes the files of these component updates
	for (const value of body.values) {
		for (let i = 0; i < value.update.length; i++) {
			const update = value.update[i];
			if (!update.componentId) continue;
			
			let element = await prisma.componentElement.findFirst({
				where: {
					id: update.componentId,
					parent_id: update.parentId,
					repository_id: branch.repository_id
				}
			});
			if (!element) {
				await indexForComponent(update.componentId, update.parentId, repository);
			}

			element = await prisma.componentElement.findFirst({
				where: {
					id: update.componentId,
					parent_id: update.parentId,
					repository_id: branch.repository_id
				}
			});
			let error: string | undefined = undefined;

			//If the element was not created, or if this is text and it is not a static string 
			//(i.e it is tied to a property or containing component) then this is an error that needs to be reverted
			if (!element) {
				error = 'element';
			} else if (update.type === 'text') {
				const textAttribute = await prisma.componentAttribute.findFirst({
					where: {
						component_id: update.componentId,
						component_parent_id: update.parentId,
						type: 'text',
						name: 'string'
					}
				});
				if (!textAttribute) {
					error = 'text';
				}
			}
			

			if (!error) {
				updates.push(update);
			} else {
				const pastError = await prisma.componentError.findUnique({
					where: {
						component_parent_id_component_id: {
							component_id: update.componentId,
							component_parent_id: update.parentId
						},
						repository_id: branch.repository_id
					}
				});

				if (!pastError) {
					await prisma.componentError.create({
						data: {
							component_id: update.componentId,
							component_parent_id: update.parentId,
							repository_id: branch.repository_id,
							type: error
						},
					})
					errorUpdates.push({...update, errorType: error});
				}
			}
		}
	}

	for (const up of updates) {
		await prisma.componentUpdate.create({
			data: {
				component_parent_id: up.parentId,
				component_id: up.componentId,
				action: up.action,
				type: up.type,
				name: up.name,
				value: up.value,
				branch_id: branchId,
				old_value: up.oldValue,
				childIndex: up.childIndex,
				is_global: up.isGlobal
			}
		})
	}
	// await prisma.componentUpdate.createMany({
	// 	data: updates.map(up => ({
	// 		component_parent_id: up.parentId,
	// 		component_id: up.componentId,
	// 		action: up.action,
	// 		type: up.type,
	// 		name: up.name,
	// 		value: up.value,
	// 		branch_id: branchId,
	// 		old_value: up.oldValue
	// 	}))
	// });

	const reversed = reverseUpdates(errorUpdates);
	const response: UpdateResponse = {errorUpdates: reversed};
	return new Response(JSON.stringify(response), {
		status: 200,
	})
}

export async function indexForComponent(componentId: string, parentId: string, repository: Repository) {
	const githubRepository = new GithubRepository(repository);

	const readFile = async (filepath: string) => {
		//TOOD: Need to deal with actual branch probably at some point
		const content = //await getFile(`/Users/braydonjones/Documents/Projects/formbricks/${filepath}`);
		await getFileContent(githubRepository, filepath, repository.branch);

		return content;
	}

	//TODO: This does not follow the file up the whole tree which means it does not know
	// all of the possible locations an attribute can be saved. Find a better way to do this
	const {file: elementFile} = getLocationFromComponentId(componentId);
	const {file: parentFile} = getLocationFromComponentId(parentId);
	const paths = [elementFile];
	if (parentFile) {
		paths.push(parentFile);
	}
	await indexFilesAndFollowImports(paths, readFile, repository.id)
}

// const getResponseFromGPT = async (body: RequestBody, githubRepository: GithubRepository, possibleComponents: ComponentLocation[], branch: string) => {
// 	const possibleComponentsSnippets = await Promise.all(possibleComponents.map((location) => getCodeSnippet(githubRepository)(location, branch)));

// 	const response = await openai.chat.completions.create({
// 		model: 'gpt-3.5-turbo',
// 		messages: [
// 			{role: 'system', content: 'You are a front end React developer tasked with making edits to a code base.'},
// 			{role: 'user', content:
// 				`Given a React codebase, I need to make a specific edit to the code to update a static property on the DOM. I do not know what the change is or where exactly it should be, but it could be right at the element level or as a property passed to a component. Here are possible code snippets where the change should occur:

// ${JSON.stringify(possibleComponentsSnippets)}

// The change I want to make is to update the text/content of a specific DOM element or component property to '${body.updates[0].value}' where the previous value is '${body.old[0].value}'.

// Please analyze the given code snippets, identify the correct location for this edit, and make that edit. It might not necessarily be right at the DOM element; it could involve modifying a component property or variable. Remember that this is a static change and should not introduce any unecessary complexity.

// Provide the old code, the updated code, and the index of which code snippet the change occurs in this JSON format: {oldCode: string, newCode: string, snippetIndex: number}`}
// 		],
// 	})
// 	if (response.choices[0].finish_reason === 'stop' && response.choices[0].message.content) {
// 		const parsed = changesSchema.safeParse(JSON.parse(response.choices[0].message.content));
// 		if (!parsed.success) throw new Error('Invalid response from openai');
// 		const {oldCode, newCode, snippetIndex} = parsed.data;

// 		const referencedComponent = possibleComponents[snippetIndex];
// 		const referencedSnippet = possibleComponentsSnippets[snippetIndex];
// 		if (referencedComponent === undefined || referencedSnippet === undefined) {
// 			throw new Error('Invalid response from openai');
// 		}

// 		const newSnippet = referencedSnippet.replace(oldCode, newCode);
// 		if (newSnippet === referencedSnippet) {
// 			throw new Error("Invalid response from openai. Can't update code snippet");
// 		}
// 		return {location: referencedComponent, updatedCode: newSnippet};
// 	} else {
// 		throw new Error('Invalid response from openai');
// 	}
// }