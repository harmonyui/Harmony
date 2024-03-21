import { NextRequest } from 'next/server';
import { prisma } from '../../../../src/server/db';
import { ComponentUpdate, updateSchema } from '@harmony/ui/src/types/component';
import { LoadResponse, loadResponseSchema } from '@harmony/ui/src/types/network';
import { GithubRepository } from '../../../../src/server/api/repository/github';
import { getBranch, getRepository } from '../../../../src/server/api/routers/branch';
import { getLocationFromComponentId } from '../../update/[branchId]/route';
import {diffChars, diffLines} from 'diff';
import { hashComponentId, updateLocationFromDiffs } from '@harmony/util/src';


export async function GET(req: NextRequest, {params}: {params: {repositoryId: string}}): Promise<Response> {
	const {repositoryId} = params;

	const repository = await getRepository({prisma, repositoryId});
	if (!repository) throw new Error("No repo");

	const url = new URL(req.url);
	const branchId = url.searchParams.get('branchId');

	if (!branchId) {
		return new Response(JSON.stringify({message: "Invalid body parameters"}), {
			status: 400
		})
	}

	const pullRequest = await prisma.pullRequest.findUnique({
		where: {
			branch_id: branchId
		}
	});

	const isPublished = Boolean(pullRequest);

	//await indexCodebase(process.cwd(), fromDir, repositoryId);

	let updates: ComponentUpdate[] = [];

	const query = await prisma.$queryRaw<{action: string, type: string, childIndex: number, name: string, value: string, oldValue: string, id: string, parentId: string}[]>`
		SELECT u.action, u.type, u.name, u."childIndex", u.value, u.old_value as "oldValue", e.id, e.parent_id as "parentId" FROM "ComponentUpdate" u
		INNER JOIN "ComponentElement" e on e.id = component_id AND e.parent_id = component_parent_id
		WHERE u.branch_id = ${branchId}
		ORDER BY u.date_modified ASC`


	updates = query.map(up => ({
		action: up.action as ComponentUpdate['action'],
		type: up.type as ComponentUpdate['type'],
		name: up.name,
		value: up.value,
		oldValue: up.oldValue,
		componentId: up.id,
		parentId: up.parentId,
		childIndex: up.childIndex
	}));

	const githubRepository = new GithubRepository(repository);
	const ref = await githubRepository.getBranchRef(repository.branch);

	const getNewComponentId = async (oldId: string, ref: string) => {
		const location = getLocationFromComponentId(oldId);
		const diffs = await githubRepository.diffFiles(repository.branch, ref, location.file);
		
		const newLocation = updateLocationFromDiffs(location, diffs);
		if (!newLocation) return undefined;

		const newId = hashComponentId(newLocation);

		return newId;
	}
	
	if (ref !== repository.ref) {
		for (const update of updates) {
			const oldId = update.componentId;
			const oldParentId = update.parentId;
			const newComponentId = await getNewComponentId(oldId, repository.ref);
			const newParentId = await getNewComponentId(oldParentId, repository.ref);

			if (newComponentId === undefined || newParentId === undefined) {
				console.log(`Conflict in a saved component: ${newComponentId ? oldParentId : oldId}`);
				continue;
			}

			if (newComponentId !== oldId) {
				await prisma.componentElement.updateMany({
					where: {
						parent_id: oldId
					},
					data: {
						parent_id: newComponentId
					}
				});
				await prisma.componentElement.updateMany({
					where: {
						id: oldId
					},
					data: {
						id: newComponentId
					}
				});
				updates.forEach(up => {
					if (up.componentId === oldId) {
						up.componentId = newComponentId;
					}

					if (up.parentId === oldId) {
						up.parentId = newComponentId
					}
				})
			}
			if (newParentId !== oldParentId) {
				await prisma.componentElement.updateMany({
					where: {
						parent_id: oldParentId
					},
					data: {
						parent_id: newParentId
					}
				});
				await prisma.componentElement.updateMany({
					where: {
						id: oldParentId
					},
					data: {
						id: newParentId
					}
				});
				updates.forEach(up => {
					if (up.componentId === oldParentId) {
						up.componentId = newComponentId;
					}

					if (up.parentId === oldParentId) {
						up.parentId = newComponentId
					}
				})
			}
		}

		await prisma.repository.update({
			where: {
				id: repository.id,
			},
			data: {
				ref
			}
		})
	}

	const branches = await prisma.branch.findMany({
		where: {
			repository_id: repositoryId
		}
	});

	const errorElements = await prisma.componentError.findMany({
		where: {
			repository_id: repositoryId
		}
	})

	return new Response(JSON.stringify(loadResponseSchema.parse({
		updates,
		branches: branches.map(branch => ({
			id: branch.id,
			name: branch.label
		})),
		errorElements: errorElements.map(element => ({componentId: element.component_id, parentId: element.component_parent_id, type: element.type})),
		isPublished
	} satisfies LoadResponse)));
}