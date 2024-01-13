import { branchItemSchema, pullRequestSchema } from "@harmony/types/branch";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { GithubRepository } from "../repository/github";
import { z } from "zod";
import { PullRequest } from "@harmony/types/branch";

export const pullRequestRouter = createTRPCRouter({
    createPullRequest: protectedProcedure
        .input(z.object({pullRequest: pullRequestSchema, branch: branchItemSchema}))
        .mutation(async ({ctx, input}) => {
            const githubRepository = new GithubRepository(ctx.session.account.repository);
            
            const url = await githubRepository.createPullRequest(input.branch.name, input.pullRequest.title, input.pullRequest.body);

            const newPullRequest = await ctx.prisma.pullRequest.create({
                data: {
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