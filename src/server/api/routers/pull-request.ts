import { BranchItem, Repository, branchItemSchema, pullRequestSchema } from "../../../../packages/ui/src/types/branch";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { GithubRepository } from "../repository/github";
import { z } from "zod";
import { PullRequest } from "../../../../packages/ui/src/types/branch";
import { prisma } from "../../db";

export const pullRequestRouter = createTRPCRouter({
    createPullRequest: protectedProcedure
        .input(z.object({pullRequest: pullRequestSchema, branch: branchItemSchema}))
        .mutation(async ({ctx, input}) => {
            if (!ctx.session.account.repository) {
                throw new Error("Cannot create publish request without repository");
            }

            return createPullRequest({branch: input.branch, pullRequest: input.pullRequest, repository: ctx.session.account.repository});
        })
});

export async function createPullRequest({branch, pullRequest, repository}: {branch: BranchItem, pullRequest: {title: string, body: string}, repository: Repository}) {
    const githubRepository = new GithubRepository(repository);
            
    const url = await githubRepository.createPullRequest(branch.name, pullRequest.title, pullRequest.body);

    const newPullRequest = await prisma.pullRequest.create({
        data: {
            repository_id: repository.id,
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