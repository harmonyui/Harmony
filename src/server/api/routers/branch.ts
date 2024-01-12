import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { branchItemSchema } from "@harmony/types/branch";
import { GithubRepository } from "../repository/github";

export const branchRoute = createTRPCRouter({
	getBranches: protectedProcedure
		.query(async ({ctx}) => {
			const branches = await ctx.prisma.branch.findMany();

			return branches;
		}),
	createBranch: protectedProcedure
		.input(z.object({branch: branchItemSchema}))
		.mutation(async ({ctx, input}) => {
			const githubRepository = new GithubRepository(ctx.session.account.oauthToken, ctx.session.account.repository);
			await githubRepository.createBranch(input.branch.name);
			
			const newBranch = await ctx.prisma.branch.create({
				data: {
					label: input.branch.label,
					name: input.branch.name
				}
			});

			return newBranch;
		})
})