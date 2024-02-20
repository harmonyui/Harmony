import { publishRequestSchema } from "@harmony/ui/src/types/network";
import { prisma } from "../../../src/server/db";
import { createPullRequest } from "../../../src/server/api/routers/pull-request";
import { getBranch } from "../../../src/server/api/routers/branch";
import { ComponentLocation, ComponentUpdate } from "@harmony/ui/src/types/component";
import { Branch, Prisma } from "@prisma/client";
import { GithubRepository } from "../../../src/server/api/repository/github";
import { getCodeSnippet } from "../../../src/server/api/services/indexor/github";
import { BranchItem, Repository } from "@harmony/ui/src/types/branch";

export async function POST(req: Request): Promise<Response> {
    const request = publishRequestSchema.safeParse(await req.json());
    if (!request.success) {
        return new Response(JSON.stringify("Invalid parameters"), {
            status: 400
        });
    }

    const data = request.data;
    const {branchId, pullRequest} = data;

	const branch = await getBranch({prisma, branchId});
	if (!branch) {
		throw new Error("Cannot find branch with id " + branchId);
	}

    const repository = await prisma.repository.findUnique({
        where: {
            id: branch.repositoryId
        }
    });
    if (!repository) {
        throw new Error("Cannot find repository with id " + branch.repositoryId);
    }

    
    //Get rid of same type of updates (more recent one wins)
    const updates: ComponentUpdate[] = branch.updates.reduce<ComponentUpdate[]>((prev, curr) => prev.find(p => p.type === curr.type && p.name === curr.name && p.componentId === curr.componentId && p.parentId === curr.parentId) ? prev : prev.concat([curr]), []);
    const old: string[] = branch.old;
    await findAndCommitUpdates(updates, old, repository, branch);

    const newPullRequest = await createPullRequest({branch, pullRequest, repository})

    return new Response(JSON.stringify({pullRequest: newPullRequest}), {
        status: 200
    })
}

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

async function createGithubBranch(repository: Repository, branchName: string): Promise<void> {
    const githubRepository = new GithubRepository(repository);
	await githubRepository.createBranch(branchName);
}

async function findAndCommitUpdates(updates: ComponentUpdate[], old: string[], repository: Repository, branch: BranchItem) {
	const elementInstances = await prisma.componentElement.findMany({
		where: {
			repository_id: repository.id,
		},
		...elementPayload
	})
	
	const githubRepository = new GithubRepository(repository);
	let fileUpdates: FileUpdate[] = [];

	for (let i = 0; i < updates.length; i++) {
        //TODO: Right now we are creating the branch right before updating which means we need to use 'master' branch here.
        // in the future we probably will use the actual branch
		const result = await getChangeAndLocation(updates[i], old[i], githubRepository, elementInstances, repository.branch);

        if (result)
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

    await createGithubBranch(repository, branch.name);
	await githubRepository.updateFilesAndCommit(branch.name, Object.values(commitChanges));
}

async function getChangeAndLocation(update: ComponentUpdate, _oldValue: string, githubRepository: GithubRepository, elementInstances: ComponentElementPrisma[], branchName: string): Promise<FileUpdate | undefined> {
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

	let result: FileUpdate | undefined;

	switch(type) {
		case 'text':
			const textAttribute = attributes.find(attr => attr.type === 'text');
			const {location, value} = getLocationAndValue(textAttribute);
			
			const elementSnippet = await getCodeSnippet(githubRepository)(location, branchName);
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