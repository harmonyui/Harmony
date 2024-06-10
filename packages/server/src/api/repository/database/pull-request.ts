import type { BranchItem, PullRequest } from "@harmony/util/src/types/branch";
import { prisma } from "@harmony/db/lib/prisma";
import type { GitRepository } from "../git/types";

export async function createPullRequest({branch, pullRequest, gitRepository}: {branch: BranchItem, pullRequest: {title: string, body: string}, gitRepository: GitRepository}) {
    const url = await gitRepository.createPullRequest(branch.name, pullRequest.title, pullRequest.body);

    const newPullRequest = await prisma.pullRequest.create({
        data: {
            repository_id: gitRepository.repository.id,
            title: pullRequest.title,
            body: pullRequest.body,
            url,
            branch_id: branch.id
        }
    });

    return {
        id: newPullRequest.id,
        title: newPullRequest.title,
        body: newPullRequest.body,
        url: newPullRequest.url
    } satisfies PullRequest
}