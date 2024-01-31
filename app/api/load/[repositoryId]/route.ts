import { NextRequest } from 'next/server';
import { prisma } from '../../../../src/server/db';
import { ComponentUpdate as PrismaComponentUpdate } from '@prisma/client';
import { ComponentUpdate, updateSchema } from '@harmony/ui/src/types/component';
import { z } from 'zod';
import { fromGithub } from '../../../../src/server/api/services/indexor/github';
import { indexCodebase } from '../../../../src/server/api/services/indexor/indexor';
import { GithubRepository } from '../../../../src/server/api/repository/github';

export async function GET(req: NextRequest, {params}: {params: {repositoryId: string}}): Promise<Response> {
	const {repositoryId} = params;

	const repository = await prisma.repository.findUnique({
		where: {
			id: repositoryId
		}
	});
	if (!repository) throw new Error("No repo");

	const url = new URL(req.url);
	const branchId = url.searchParams.get('branchId');

	if (branchId) {
		const updates = await prisma.$queryRaw<{action: string, type: string, name: string, value: string, id: string, parentId: string}[]>`
			SELECT u.action, u.type, u.name, u.value, e.id, e.parent_id as "parentId" FROM "ComponentUpdate" u
			INNER JOIN "Commit" c ON c.id = commit_id 
			INNER JOIN "ComponentElement" e on e.id = component_id AND e.parent_id = component_parent_id
			WHERE c.branch_id = ${branchId}`
		

		return new Response(JSON.stringify(z.array(updateSchema).parse(updates.map(up => ({
			action: up.action as ComponentUpdate['action'],
			type: up.type as ComponentUpdate['type'],
			name: up.name,
			value: up.value,
			componentId: up.id,
			parentId: up.parentId
		}) satisfies ComponentUpdate))), {
			status: 200,
		})
	}

	return new Response(null, {
		status: 400
	});
}

