import { BranchItem, branchItemSchema, pullRequestSchema } from "@harmony/util/src/types/branch";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { PullRequest } from "@harmony/util/src/types/branch";
import { prisma } from "@harmony/db/lib/prisma";
import { GitRepository } from "../repository/github";

export const pullRequestRouter = createTRPCRouter({
    createPullRequest: protectedProcedure
        .input(z.object({pullRequest: pullRequestSchema, branch: branchItemSchema}))
        .mutation(async ({ctx, input}) => {
            if (!ctx.session.account.repository) {
                throw new Error("Cannot create publish request without repository");
            }

            const gitRepository = ctx.gitRepositoryFactory.createGitRepository(ctx.session.account.repository);
            return createPullRequest({branch: input.branch, pullRequest: input.pullRequest, gitRepository});
        })
});

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