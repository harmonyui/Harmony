import { ComponentElementBase, ComponentUpdate } from "@harmony/util/src/types/component";
import { z } from "zod";
import fs from 'node:fs';
import { getLocationFromComponentId, hashComponentId, updateLocationFromContent } from "@harmony/util/src/utils/component";
import { prisma } from "@harmony/db/lib/prisma";
import { GithubRepository } from "../../repository/github";
import { replaceByIndex } from "@harmony/util/src/utils/common";

export const changesSchema = z.object({
	oldCode: z.string(),
	newCode: z.string(),
	snippetIndex: z.number(),
});

export type Changes = z.infer<typeof changesSchema>;

export async function makeChanges(referencedComponent: ComponentElementBase, newSnippet: string): Promise<void> {
	const file = fs.readFileSync(referencedComponent.location.file, 'utf-8');
	const updatedFile = replaceByIndex(file, newSnippet, referencedComponent.location.start, referencedComponent.location.end);
	fs.writeFileSync(referencedComponent.location.file, updatedFile);
}

export interface FileContentRetriever {
	getOldFileContent: (file: string) => Promise<string>;
	getNewFileContent: (file: string) => Promise<string>;
}
export class ComponentIdUpdator {
	constructor(private fileRetriever: FileContentRetriever) {

	}

	public async getNewIdsForComponentsFromFile(file: string, elementIds: string[]) {
		const oldContent = await this.fileRetriever.getOldFileContent(file);
		const newContent = await this.fileRetriever.getNewFileContent(file);

		if (oldContent === newContent) return [];
		
		const idMapping: {oldId: string, newId: string}[] = [];
		for (const id of elementIds) {
			const location = getLocationFromComponentId(id);
			const newLocation = updateLocationFromContent(location, oldContent, newContent);
	
			if (newLocation) {
				const newId = hashComponentId(newLocation);
				id !== newId && idMapping.push({oldId: id, newId});
			} else {
				console.log(`Conflict in a saved component: ${id}`);
			}
		}
	
		return idMapping;
	}
}

export class GithubFileRetriver implements FileContentRetriever {
	constructor(private oldRef: string, private githubRepository: GithubRepository) {}

	public async getOldFileContent(file: string) {
		const content = await this.githubRepository.getContent(file, this.oldRef);

		return content;
	}

	public async getNewFileContent(file: string) {
		const content = await this.githubRepository.getContent(file, this.githubRepository.repository.branch);

		return content;
	}
}

/**
 * Because the component Ids are dependent on the line number of the element, if the line number ever gets out of date
 * because of independent updates to the file, we need to update the component id 
 * @param updates 
 * @param ref 
 * @param githubRepository 
 */
export async function updateComponentIdsFromUpdates(updates: ComponentUpdate[], ref: string, githubRepository: GithubRepository) {
	const filesRetrieved: string[] = [];
	for (const update of updates) {
		const oldId = update.componentId;
		const oldParentId = update.parentId;
		const componentLocation = getLocationFromComponentId(oldId);
		const parentLocation = getLocationFromComponentId(oldParentId);

		const componentIdMappings = !filesRetrieved.includes(componentLocation.file) ? await getNewIdsFromFile(componentLocation.file, ref, githubRepository) : [];
		filesRetrieved.push(componentLocation.file);
		
		if (!filesRetrieved.includes(parentLocation.file)) {
			const parentMappings = await getNewIdsFromFile(parentLocation.file, ref, githubRepository);
			componentIdMappings.push(...parentMappings)
			filesRetrieved.push(parentLocation.file);
		}
		
		for (const mapping of componentIdMappings) {
			const {oldId, newId} = mapping;

			await updateElementIds(oldId, newId, updates);
		}
	}
}

async function getElementsInFile(file: string) {
	const elements = await prisma.componentElement.findMany({
		where: {
			location: {
				file
			}
		}
	});

	return elements;
}

async function getNewIdsFromFile(file: string, oldRef: string, githubRepository: GithubRepository) {
	const elementsInFile = await getElementsInFile(file);

	const fileRetriever = new GithubFileRetriver(oldRef, githubRepository);
	const componentIdUpdator = new ComponentIdUpdator(fileRetriever)
	const componentIdMappings = await componentIdUpdator.getNewIdsForComponentsFromFile(file, elementsInFile.map(el => el.id))
	

	return componentIdMappings;
}

async function updateElementIds(oldId: string, newId: string, updates: ComponentUpdate[]) {
	await prisma.componentElement.updateMany({
		where: {
			parent_id: oldId
		},
		data: {
			parent_id: newId
		}
	});
	await prisma.componentElement.updateMany({
		where: {
			id: oldId
		},
		data: {
			id: newId
		}
	});
	updates.forEach(up => {
		if (up.componentId === oldId) {
			up.componentId = newId;
		}

		if (up.parentId === oldId) {
			up.parentId = newId
		}
	});
}