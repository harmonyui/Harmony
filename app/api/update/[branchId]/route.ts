import { ComponentLocation, ComponentUpdate } from '../../../../packages/ui/src/types/component';
import { prisma } from '../../../../src/server/db';
import { Branch, Prisma } from '@prisma/client';
import { getCodeSnippet, getFileContent } from '../../../../src/server/api/services/indexor/github';
import { GithubRepository } from '../../../../src/server/api/repository/github';

import { updateRequestBodySchema } from '@harmony/ui/src/types/network';
import { indexFileAndFollowImports } from '../../../../src/server/api/services/indexor/indexor';

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

	const repository = await prisma.repository.findUnique({
		where: {
			id: branch.repository_id
		}
	})
	if (repository === null) {
		throw new Error("Cannot find repository with id " + branch.repository_id)
	}
	const body = updateRequestBodySchema.parse(await req.json());

	const githubRepository = new GithubRepository(repository);

	const readFile = async (filepath: string) => {
		const content = await getFileContent(githubRepository, filepath, branch.name);

		return content;
	}

	const updates: (ComponentUpdate & {oldValue: string})[] = [];
	for (const value of body.values) {
		for (let i = 0; i < value.update.length; i++) {
			const update = value.update[i];
			const old = value.old[i];

			const element = await prisma.componentElement.findFirst({
				where: {
					id: update.componentId,
					parent_id: update.parentId,
					repository_id: branch.repository_id
				}
			});
			if (!element) {
				const {file, startLine, startColumn, endLine, endColumn} = getLocationFromComponentId(update.componentId);
				await indexFileAndFollowImports(file, readFile, repository.id)
			}

			updates.push({...update, oldValue: old.value});
		}
	}

	await prisma.componentUpdate.createMany({
		data: updates.map(up => ({
			component_parent_id: up.parentId,
			component_id: up.componentId,
			action: up.action,
			type: up.type,
			name: up.name,
			value: up.value,
			branch_id: branchId,
			old_value: up.oldValue
		}))
	});

	return new Response(JSON.stringify({}), {
		status: 200,
	})
}

function getLocationFromComponentId(id: string): {file: string, startLine: number, startColumn: number, endLine: number, endColumn: number} {
	const stuff = atob(id);
	const [file, startLine, startColumn, endLine, endColumn] = stuff.split(':');

	return {
		file, 
		startLine: Number(startLine), 
		startColumn: Number(startColumn), 
		endLine: Number(endLine), 
		endColumn: Number(endColumn)
	};
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