import { NextRequest } from 'next/server';
import { prisma } from '../../../../src/server/db';

export async function GET(req: NextRequest, {params}: {params: {repositoryId: string}}): Promise<Response> {
	const {repositoryId} = params;

	const elementInstances = await prisma.componentElement.findMany({
		where: {
			repository_id: repositoryId
		}
	});

	return new Response(JSON.stringify(elementInstances.map(el => Number(el.id))), {
		status: 200,
	})
}

