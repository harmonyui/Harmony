import { NextRequest } from 'next/server';
import { prisma } from '../../../../src/server/db';
import { ComponentUpdate } from '@harmony/ui/src/types/component';
import { LoadResponse, loadResponseSchema } from '@harmony/ui/src/types/network';
import { GithubRepository } from '../../../../src/server/api/repository/github';
import { getRepository } from '../../../../src/server/api/routers/branch';
import { updateComponentIdsFromUpdates } from '../../../../src/server/api/services/updator/local';
import { indexCodebase } from '../../../../src/server/api/services/indexor/indexor';
import { fromDir } from '../../../../src/server/api/services/indexor/local';


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

	//await indexCodebase('/Users/braydonjones/Documents/Projects/formbricks', fromDir, repositoryId);

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

	//If the current repository ref is out of date, that means we have some
	//new commits that might affect our previously indexed component elements.
	//Let's go through the diffs and update those component ids
	if (ref !== repository.ref) {
		await updateComponentIdsFromUpdates(updates, repository.ref, githubRepository);

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
		pullRequest: pullRequest || undefined,
		showWelcomeScreen: !accountTiedToBranch.seen_welcome_screen,
		isDemo: accountTiedToBranch.role === 'quick'
	} satisfies LoadResponse)));
}