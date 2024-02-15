import { branchItemSchema, pullRequestSchema } from "../../../../packages/ui/src/types/branch";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { GithubRepository } from "../repository/github";
import { z } from "zod";
import { PullRequest } from "../../../../packages/ui/src/types/branch";

export const pullRequestRouter = createTRPCRouter({
    createPullRequest: protectedProcedure
        .input(z.object({pullRequest: pullRequestSchema, branch: branchItemSchema}))
        .mutation(async ({ctx, input}) => {
            if (!ctx.session.account.repository) {
                throw new Error("Cannot create publish request without repository");
            }
            
            const githubRepository = new GithubRepository(ctx.session.account.repository);
            
            const url = await githubRepository.createPullRequest(input.branch.name, input.pullRequest.title, input.pullRequest.body);

            const newPullRequest = await ctx.prisma.pullRequest.create({
                data: {
                    repository_id: ctx.session.account.repository.id,
                    title: input.pullRequest.title,
                    body: input.pullRequest.body,
                    url,
                    branch_id: input.branch.id
                }
            });

            return {
                id: newPullRequest.id,
                title: newPullRequest.title,
                body: newPullRequest.body,
                url: newPullRequest.url
            } satisfies PullRequest
        })
})