import { NextRequest } from 'next/server';
import { prisma } from '../../../../src/server/db';

export async function GET(req: NextRequest, {params}: {params: {branchId: string}}): Promise<Response> {
	const {branchId} = params;

	const elementInstances = await prisma.componentElement.findMany();

	return new Response(JSON.stringify(elementInstances.map(el => Number(el.id))), {
		status: 200,
	})
}

