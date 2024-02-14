import { ComponentLocation, ComponentUpdate } from '../../../../packages/ui/src/types/component';
import { prisma } from '../../../../src/server/db';
import { Branch, Prisma } from '@prisma/client';
import { getCodeSnippet } from '../../../../src/server/api/services/indexor/github';
import { GithubRepository } from '../../../../src/server/api/repository/github';

import { updateRequestBodySchema } from '@harmony/ui/src/types/network';

const elementPayload = {
	include: {
		definition: {
			include: {
				location: true
			}
		}, 
		location: true,
		updates: true
	}
}
const attributePayload = {
	include: {
		location: true
	}
}
type ComponentElementPrisma = Prisma.ComponentElementGetPayload<typeof elementPayload>
type ComponentAttributePrisma = Prisma.ComponentAttributeGetPayload<typeof attributePayload>
type FileUpdate = {update: ComponentUpdate, dbLocation: ComponentLocation, location: (ComponentLocation & {updatedTo: number}), updatedCode: string, attribute?: ComponentAttributePrisma};

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


	const updates = body.values.map(({update: updates, old}) => {
		if (updates.length !== old.length) throw new Error("Invalid update and old parameters");
		
		return updates.map((update, i) => ({
			component_id: update.componentId,
			parent_id: update.parentId,
			action: update.action,
			type: update.type,
			name: update.name,
			value: update.value,
			branch_id: branchId,
			old_value: old[i].value
		}));
	}).flat();

	await prisma.componentUpdate.createMany({
		data: updates.map(up => ({
			component_parent_id: up.parent_id,
			component_id: up.component_id,
			action: up.action,
			type: up.type,
			name: up.name,
			value: up.value,
			branch_id: up.branch_id,
			old_value: up.old_value
		}))
	});

	return new Response(JSON.stringify({}), {
		status: 200,
	})
}

async function findAndCommitUpdates(updates: ComponentUpdate[], old: string[], repositoryId: string, branchId: string) {
	const branch = await prisma.branch.findUnique({
		where: {
			id: branchId
		}
	});
	if (branch === null) {
		throw new Error("Cannot find branch with id " + branchId);
	}

	const elementInstances = await prisma.componentElement.findMany({
		where: {
			repository_id: repositoryId,
		},
		...elementPayload
	})
	const repository = await prisma.repository.findUnique({
		where: {
			id: repositoryId
		}
	});

	if (repository === null) {
		return new Response(null, {
			status: 400
		})
	}
	
	const githubRepository = new GithubRepository(repository);
	let fileUpdates: FileUpdate[] = [];

	for (let i = 0; i < updates.length; i++) {
		const result = await getChangeAndLocation(updates[i], old[i], githubRepository, elementInstances, branch);

		fileUpdates.push(result);
	}

	fileUpdates = fileUpdates.sort((a, b) => a.location.start - b.location.start);

	const commitChanges: Record<string, {filePath: string, locations: {snippet: string, start: number, end: number, updatedTo: number, diff: number}[]}> = {};
	for (const update of fileUpdates) {
		let change = commitChanges[update.location.file];
		if (!change) {
			change = {filePath: update.location.file, locations: []}
			commitChanges[update.location.file] = change;	
		}
		const newLocation = {snippet: update.updatedCode, start: update.location.start, end: update.location.end, updatedTo: update.location.updatedTo, diff: 0};
		const last = change.locations[change.locations.length - 1];
		if (last) {
			if (last.end > newLocation.start) {
				throw new Error("Conflict in changes")
			}

			const diff = last.updatedTo - last.end + last.diff;

			newLocation.start += diff;
			newLocation.end += diff;
			newLocation.updatedTo += diff;
			newLocation.diff = diff;
		}

		const diff = (newLocation.updatedTo - newLocation.end);

		const ends = fileUpdates.filter(f => f.dbLocation.end >= update.location.end);
		ends.forEach(end => {
			
			end.dbLocation.end += diff;
			if (end.dbLocation.start >= newLocation.start) {
				end.dbLocation.start += diff;
			}
		});

		change.locations.push(newLocation);
	}

	await githubRepository.updateFilesAndCommit(branch.name, Object.values(commitChanges));
}

async function getChangeAndLocation(update: ComponentUpdate, _oldValue: string, githubRepository: GithubRepository, elementInstances: ComponentElementPrisma[], branch: Branch): Promise<FileUpdate> {
	const {componentId: id, parentId, type, value} = update;
	const component = elementInstances.find(el => el.id === id && el.parent_id === parentId);
	
	if (component === undefined ) {
		throw new Error('Cannot find component with id ' + id);
	}
	
	const attributes = await prisma.componentAttribute.findMany({
		where: {
			component_id: component.id,
			component_parent_id: component.parent_id
		},
		...attributePayload
	});

	const getLocationAndValue = (attribute: ComponentAttributePrisma | undefined): {location: ComponentLocation, value: string | undefined} => {
		return {location: attribute?.location || component.location, value: attribute?.name === 'string' ? attribute.value : undefined};
	}

	let result: FileUpdate;

	switch(type) {
		case 'text':
			const textAttribute = attributes.find(attr => attr.type === 'text');
			const {location, value} = getLocationAndValue(textAttribute);
			
			const elementSnippet = await getCodeSnippet(githubRepository)(location, branch.name);
			const oldValue = value || _oldValue;
			const start = elementSnippet.indexOf(oldValue);
			const end = oldValue.length + start;
			const updatedTo = update.value.length + start;
			if (start < 0) {
				throw new Error('There was no update');
			}
			
			result = {location: {file: location.file, start: location.start + start, end: location.start + end, updatedTo: location.start + updatedTo}, updatedCode: update.value, update, dbLocation: location, attribute: textAttribute};
			break;
		default:
			throw new Error("Invalid use case");
			
	}

	return result;
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