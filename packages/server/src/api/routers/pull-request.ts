import {
  branchItemSchema,
  pullRequestSchema,
} from "@harmony/util/src/types/branch";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createPullRequest } from "../repository/database/pull-request";

export const pullRequestRouter = createTRPCRouter({
  createPullRequest: protectedProcedure
    .input(
      z.object({ pullRequest: pullRequestSchema, branch: branchItemSchema }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.account.repository) {
        throw new Error("Cannot create publish request without repository");
      }

      const gitRepository = ctx.gitRepositoryFactory.createGitRepository(
        ctx.session.account.repository,
      );
      return createPullRequest({
        branch: input.branch,
        pullRequest: input.pullRequest,
        gitRepository,
      });
    }),
});
