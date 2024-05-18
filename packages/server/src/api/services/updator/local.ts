<<<<<<< Updated upstream:packages/server/src/api/services/updator/local.ts
/* eslint-disable no-await-in-loop -- Let's deal with this one later*/
import { ComponentElementBase, ComponentUpdate } from "@harmony/util/src/types/component";
import { z } from "zod";
import fs from 'node:fs';
import { getLocationFromComponentId, hashComponentId, updateLocationFromContent } from "@harmony/util/src/utils/component";
import { prisma } from "@harmony/db/lib/prisma";
import { GithubRepository } from "../../repository/github";
import { replaceByIndex } from "@harmony/util/src/utils/common";
=======
import { ComponentElement, ComponentElementBase, ComponentUpdate, ComponentDBLocation, dbLocationSchema, locationSchema, HarmonyComponent } from '../../../../../packages/ui/src/types/component';
import { z } from "zod";
import fs from 'node:fs';
import { getLineAndColumn, getLocationFromComponentId, hashComponentId, replaceByIndex, updateLocationFromContent } from "@harmony/util/src";
import { prisma } from "../../../db";
import { GithubRepository } from '../../repository/github';
import { diffLines } from "diff";
import { getRepository } from "../../routers/branch";
import { Repository } from "@harmony/ui/src/types/branch";
import { Branch } from '@prisma/client';
import { getCodeInfoAndNormalizeFromFiles, getCodeInfoFromFile, normalizeCodeInfo } from "../indexor/indexor";
import { getFileContent } from '../indexor/github';
import { ComponentLocation } from "harmony-ai-editor/dist/esm/util/src/types/component";

/**
 * Because the component Ids are dependent on the line number of the element, if the line number ever gets out of date
 * because of independent updates to the file, we need to update the component id ,
 * we also need to take into account of the the independent updates with new component
 * @param updates 
 * @param ref : the incoming commit
 * @param githubRepository : the current commit  
 */
export async function updateComponentIdsFromUpdates(updates: ComponentUpdate[], ref: string, githubRepository: GithubRepository) {

	const files = await githubRepository.getCommitDiffFiles(ref);
	if (files) {
		// try to get all updates here
	
		for (const file of files) {
			const currentFile = file.filename;
			// current file need to be encoded.
			const filesRetrieved: string[] = [];
			const componentIdMappings = !filesRetrieved.includes(currentFile) ? await getNewIdsFromFile(currentFile, ref, githubRepository) : [];
			filesRetrieved.push(currentFile);

			for (const mapping of componentIdMappings) {
				const { oldId, newId, location } = mapping;
				await updateElementIds(oldId, newId, location, updates);
				//TODO: also update the ComponentUpdates
			}
		}
	}
}

/**
 * This will update the files to 
 * @param file 
 * @param oldRef 
 * @param githubRepository 
 * @returns 
 */
async function getNewIdsFromFile(file: string, oldRef: string, githubRepository: GithubRepository) {
	const elementsInFile = await getElementsInFile(file);
	let fileData: { id: string, componentLocation: ComponentLocation }[] = [];
	for (const element of elementsInFile) {
		fileData.push({ id: element.id, componentLocation: element.location });
	}
	const fileRetriever = new GithubFileRetriver(oldRef, githubRepository);
	const componentIdUpdator = new ComponentIdUpdator(fileRetriever)
	const componentIdMappings = await componentIdUpdator.getNewIdsForComponentsFromFile(file, fileData);

	return componentIdMappings;
}




interface FileAndContent {
	file: string;
	content: string;
}
>>>>>>> Stashed changes:src/server/api/services/updator/local.ts

export const changesSchema = z.object({
	oldCode: z.string(),
	newCode: z.string(),
	snippetIndex: z.number(),
});

export type Changes = z.infer<typeof changesSchema>;

// eslint-disable-next-line @typescript-eslint/require-await -- This function is polymorphic so we need the await
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

	public componentDefinitions: Record<string, HarmonyComponent> = {};
	public instances: ComponentElement[] = [];
	public importDeclarations: Record<string, { name: string, path: string }> = {};

	constructor(private fileRetriever: FileContentRetriever) {

	}

	/**
	 * Because there are two types of updates, We need to first look into new components and second look into the old components and update everything
	 * @param file 
	 * @param elementIds 
	 * @returns 
	 */
	public async getNewIdsForComponentsFromFile(file: string, elementIds: { id: string, componentLocation: ComponentLocation }[]) {
		const updatedNewIds: Set<string> = new Set();
		const oldContent = await this.fileRetriever.getOldFileContent(file);
		const newContent = await this.fileRetriever.getNewFileContent(file);

		if (oldContent === newContent) return [];

		
		const existingIdMapping: { oldId: string, newId: string, location: { file: string, start: number, end: number } }[] = [];
		for (const { id, componentLocation: location } of elementIds) {
			const startLineAndColumn = getLineAndColumn(oldContent, location.start);
			const endLineAndColumn = getLineAndColumn(oldContent, location.end);
			const lineAndColumnLocation: ComponentDBLocation = { file: oldContent, startLine: startLineAndColumn.line, startColumn: startLineAndColumn.column, endLine: endLineAndColumn.line, endColumn: endLineAndColumn.column };
			const newLocation = updateLocationFromContent(lineAndColumnLocation, oldContent, newContent)
			
			if (newLocation) {
				const newId = hashComponentId(newLocation);
				if(id !== newId){
					existingIdMapping.push({ oldId: id, newId: newId, location: location, });
					updatedNewIds.add(newId);
				}
			} else {
				console.log(`Conflict in a saved component: ${id}`);
			}
			
		}
		
		// get all the Components here
		if (!getCodeInfoFromFile(file, newContent, this.componentDefinitions, this.instances, this.importDeclarations)) {
			console.log(`Conflict in fetching components`);
		} 
		const elements = normalizeCodeInfo(this.componentDefinitions, this.instances);
		const newElements = elements.filter(element => !updatedNewIds.has(element.id))
		

		return existingIdMapping;
	}

	private async getNewFileComponentDefinition(file: string, newContent: string) {


		const elementInstance = getCodeInfoFromFile(file, newContent, this.componentDefinitions, this.instances, this.importDeclarations);
		return elementInstance;
	}
}

export class GithubFileRetriver implements FileContentRetriever {
	constructor(private oldRef: string, private githubRepository: GithubRepository) { }

	public async getOldFileContent(file: string) {
		const content = await this.githubRepository.getContent(file, this.oldRef);

		return content;
	}

	public async getNewFileContent(file: string) {
		const content = await this.githubRepository.getContent(file, this.githubRepository.repository.branch);

		return content;
	}
}

<<<<<<< Updated upstream:packages/server/src/api/services/updator/local.ts
/**
 * Because the component Ids are dependent on the line number of the element, if the line number ever gets out of date
 * because of independent updates to the file, we need to update the component id 
 * @param updates -- 
 * @param ref --
 * @param githubRepository --
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
			const {oldId: _oldId, newId} = mapping;

			await updateElementIds(_oldId, newId, updates);
		}
	}
}
=======
/*** ALL DB functions below here */

>>>>>>> Stashed changes:src/server/api/services/updator/local.ts

async function getElementsInFile(file: string) {
	const elements = await prisma.componentElement.findMany({
		where: {
			location: {
				file
			}
		},
		include: {
			location: true
		}
	});

	return elements;
}



// leave the componentupdate here for now, not using it currently
async function updateElementIds(oldId: string, newId: string, location: {
	file: string,
	start: number,
	end: number,
}, updates: ComponentUpdate[]) {
	await prisma.componentElement.updateMany({
		where: {
			parent_id: oldId
		},
		data: {
			parent_id: newId
		}
	});
	const updated = await prisma.componentElement.updateMany({
		where: {
			id: oldId,
		},
		data: {
			id: newId,

		}
	});

	console.log(updated);

	// await prisma.location.update({
	// 	where: {
	// 		id: 
	// 	},
	// 	data: {
	// 		id: newId,
	// 		file: location.file,
	// 		start: location.startColumn,
	// 		en
	// 	}
	// })


	// updates.forEach(up => {
	// 	if (up.componentId === oldId) {
	// 		up.componentId = newId;
	// 	}

	// 	if (up.parentId === oldId) {
	// 		up.parentId = newId
	// 	}
	// });
}