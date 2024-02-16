import { publishRequestSchema } from "@harmony/ui/src/types/network";
import { prisma } from "../../../src/server/db";
import { createPullRequest } from "../../../src/server/api/routers/pull-request";
import { getBranch } from "../../../src/server/api/routers/branch";

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

    const newPullRequest = await createPullRequest({branch, pullRequest, repository})

    return new Response(JSON.stringify({pullRequest: newPullRequest}), {
        status: 200
    })
}