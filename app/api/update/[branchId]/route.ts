import { Attribute, ComponentElement, ComponentElementBase, ComponentLocation, HarmonyComponent, updateSchema, updateRequestBodySchema, RequestBody, ComponentUpdate } from '../../../../packages/ui/src/types/component';
import fs from 'node:fs';
import OpenAI from 'openai';
import { z } from 'zod';
import { changesSchema } from '../../../../src/server/api/services/updator/local';
import { prisma } from '../../../../src/server/db';
import { Prisma } from '@prisma/client';
import { getCodeSnippet } from '../../../../src/server/api/services/indexor/github';
import { GithubRepository } from '../../../../src/server/api/repository/github';
import { getServerAuthSession } from '../../../../src/server/auth';
import { Repository } from '../../../../packages/ui/src/types/branch';
import { load } from 'cheerio';

const openai = new OpenAI();



const payload = {
	include: {
		definition: {
			include: {
				location: true
			}
		}, 
		location: true
	}
}
type ComponentElementPrisma = Prisma.ComponentElementGetPayload<typeof payload>

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
	const body = updateRequestBodySchema.parse(await req.json());
	
	const elementInstances = await prisma.componentElement.findMany({
		where: {
			repository_id: body.repositoryId 
		},
		...payload
	})
	const repository = await prisma.repository.findUnique({
		where: {
			id: body.repositoryId
		}
	});

	if (repository === null) {
		return new Response(null, {
			status: 400
		})
	}
	
	const githubRepository = new GithubRepository(repository);
	const fileUpdates: {componentId: string, parentId: string, location: ComponentLocation, updatedCode: string, updates: ComponentUpdate[]}[] = [];

	for (const command of body.commands) {
		const {location, updatedCode} = await getChangeAndLocation(command, githubRepository, elementInstances, branch.name);

		fileUpdates.push({componentId: command.id, parentId: command.parentId, location, updatedCode, updates: command.updates});
	}
	await githubRepository.updateFilesAndCommit(branch.name, fileUpdates.map(f => ({filePath: f.location.file, start: f.location.start, end: f.location.end, snippet: f.updatedCode})));

	const updates = fileUpdates.map(f => f.updates.map(up => ({
		component_id: f.componentId,
		parent_id: f.parentId,
		action: up.action,
		type: up.type,
		name: up.name,
		value: up.value,
		location: {
			file: f.location.file,
			start: f.location.start,
			end: f.updatedCode.length + f.location.start
		},
		location_id: ''
	}))).flat();
	for (const update of updates) {
		const location = await prisma.location.create({
			data: update.location
		});
		update.location_id = location.id;
	}

	const newCommit = await prisma.commit.create({
		data: {
			branch_id: branchId,
			updates: {
				createMany: {
					data: updates.map(up => ({
						component_parent_id: up.parent_id,
						component_id: up.component_id,
						action: up.action,
						type: up.type,
						name: up.name,
						value: up.value,
						location_id: up.location_id
					}))
				}
			}
		}
	})

	return new Response(JSON.stringify({}), {
		status: 200,
	})
}

async function getChangeAndLocation({id, parentId, updates, old}: RequestBody['commands'][number], githubRepository: GithubRepository, elementInstances: ComponentElementPrisma[], branch: string): Promise<{
	location: ComponentLocation,
	updatedCode: string
}> {
	const component = elementInstances.find(el => el.id === id);
	const parentComponent = elementInstances.find(el => el.id === parentId);

	if (component === undefined ) {
		throw new Error('Cannot find component with id ' + id);
	}
	if (parentComponent === undefined ) {
		throw new Error('Cannot find component with id ' + parentId);
	}

	//const containingComponent = component.definition;
	
	//possibleComponents.push(...[containingComponent, parentComponent].map(el => ({file: el.location.file, start: el.location.start, end: el.location.end})));
	//const [file, startLine, startCol, endLine, endCol] = atob(body.id).split(':');
	const location = component.location;//{file, start: 4761, end: 4781}
	
	let elementSnippet = await getCodeSnippet(githubRepository)(location, branch);

	for (const update of updates) {
		switch(update.type) {
			case 'text':
				const $ = load(elementSnippet, {xmlMode: true}, false);
				$(':first').text(update.value)
				elementSnippet = $.html({xmlMode: false});
				break;
			default:
				throw new Error("Invalid use case");
				
		}
	}

	return {
		updatedCode: elementSnippet,
		location
	}
	
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