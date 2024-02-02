import { Attribute, ComponentElement, ComponentElementBase, ComponentLocation, HarmonyComponent, updateSchema, ComponentUpdate } from '../../../../packages/ui/src/types/component';
import fs from 'node:fs';
import OpenAI from 'openai';
import { z } from 'zod';
import { changesSchema } from '../../../../src/server/api/services/updator/local';
import { prisma } from '../../../../src/server/db';
import { Branch, ComponentAttribute, Prisma } from '@prisma/client';
import { getCodeSnippet } from '../../../../src/server/api/services/indexor/github';
import { GithubRepository } from '../../../../src/server/api/repository/github';
import { getServerAuthSession } from '../../../../src/server/auth';
import { Repository } from '../../../../packages/ui/src/types/branch';
import { load } from 'cheerio';
import { UpdateRequest, updateRequestBodySchema } from '@harmony/ui/src/types/network';
import { compare, replaceByIndex } from '@harmony/util/src';

const openai = new OpenAI();


const updatePayload = {
	include: {
		commit: true,
		location: true
	}
}
const elementPayload = {
	include: {
		definition: {
			include: {
				location: true
			}
		}, 
		location: true,
		updates: {
			...updatePayload
		}
	}
}
const attributePayload = {
	include: {
		updates: {
			...updatePayload
		}
	}
}
type ComponentElementPrisma = Prisma.ComponentElementGetPayload<typeof elementPayload>
type ComponentAttributePrisma = Prisma.ComponentAttributeGetPayload<typeof attributePayload>
type ComponentUpdatePrisma = Prisma.ComponentUpdateGetPayload<typeof updatePayload>;
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
	
	//TODO: optimize this with a join statement to include just the updates in the current branch
	const elementInstances = await prisma.componentElement.findMany({
		where: {
			repository_id: body.repositoryId,
		},
		...elementPayload
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
	let fileUpdates: FileUpdate[] = [];

	for (const command of body.commands) {
		const results = await getChangeAndLocation(command, githubRepository, elementInstances, branch);

		fileUpdates.push(...results);
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
			// update.dbLocation.start += diff;
			// update.dbLocation.end += diff + update.location.updatedTo;
		}
		// const starts = fileUpdates.filter(f => f.dbLocation.start > newLocation.start);
		// starts.forEach(start => {
		// 	start.dbLocation.start += (newLocation.updatedTo - newLocation.end);
		// })
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

	const updates = fileUpdates.map(f => ({
		component_id: f.update.componentId,
		parent_id: f.update.parentId,
		action: f.update.action,
		type: f.update.type,
		name: f.update.name,
		value: f.update.value,
		location: {
			file: f.dbLocation.file,
			start: f.dbLocation.start,
			end: f.dbLocation.end
		},
		attribute_id: f.attribute?.id,
		location_id: ''
	}));
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
						location_id: up.location_id,
						attribute_id: up.attribute_id
					}))
				}
			}
		}
	})

	return new Response(JSON.stringify({}), {
		status: 200,
	})
}

async function getChangeAndLocation({id, parentId, updates, old}: UpdateRequest['commands'][number], githubRepository: GithubRepository, elementInstances: ComponentElementPrisma[], branch: Branch): Promise<FileUpdate[]> {
	const component = elementInstances.find(el => el.id === id && el.parent_id === parentId);
	//const parentComponent = elementInstances.find(el => el.id === parentId);

	if (component === undefined ) {
		throw new Error('Cannot find component with id ' + id);
	}
	// if (parentComponent === undefined ) {
	// 	throw new Error('Cannot find component with id ' + parentId);
	// }

	//const containingComponent = component.definition;
	
	//possibleComponents.push(...[containingComponent, parentComponent].map(el => ({file: el.location.file, start: el.location.start, end: el.location.end})));
	//const [file, startLine, startCol, endLine, endCol] = atob(body.id).split(':');
	const attributes = await prisma.componentAttribute.findMany({
		where: {
			component_id: component.id,
			component_parent_id: component.parent_id
		},
		...attributePayload
	});

	const getLocationAndValue = (attribute: ComponentAttributePrisma | undefined): {location: ComponentLocation, value: string | undefined} => {
		const filterUpdates = (updates: ComponentUpdatePrisma[]) => updates.filter(up => up.commit.branch_id === branch.id).sort((a, b) => compare(b.date_modified, a.date_modified));
		if (attribute === undefined) {
			const updates = filterUpdates(component.updates);
			const location = updates.length > 0 ? updates[0].location : component.location;

			return {location, value: undefined};
		}

		const updates = filterUpdates(attribute.updates);
		const update = updates.length > 0 ? updates[0] : undefined
		const value = attribute.name === 'string' ? update?.value || attribute.value : undefined;
		const location = update ? update.location : component.location;
		return {location, value};
	}

	const results: FileUpdate[] = [];

	for (let i = 0; i < updates.length; i++) {
		const update = updates[i];
		const _old = old[i];
		switch(update.type) {
			case 'text':
				const textAttribute = attributes.find(attr => attr.type === 'text');
				const {location, value} = getLocationAndValue(textAttribute);
				
				const elementSnippet = await getCodeSnippet(githubRepository)(location, branch.name);
				const oldValue = value || _old.value;
				const start = elementSnippet.indexOf(oldValue);
				const end = oldValue.length + start;
				const updatedTo = update.value.length + start;
				if (start < 0) {
					throw new Error('There was no update');
				}
				
				results.push({location: {file: location.file, start: location.start + start, end: location.start + end, updatedTo: location.start + updatedTo}, updatedCode: update.value, update, dbLocation: location, attribute: textAttribute});
				break;
			default:
				throw new Error("Invalid use case");
				
		}
	}

	return results;
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