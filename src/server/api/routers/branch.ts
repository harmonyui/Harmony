import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { BranchItem, branchItemSchema } from "@harmony/types/branch";
import { GithubRepository } from "../repository/github";
import { Db } from "@harmony/server/db";

export const branchRoute = createTRPCRouter({
	getBranches: protectedProcedure
		.query(async ({ctx}) => {
			return getBranches({...ctx, githubRepository: new GithubRepository(ctx.session.account.repository)})
		}),
	createBranch: protectedProcedure
		.input(z.object({branch: branchItemSchema}))
		.mutation(async ({ctx, input}) => {
			const githubRepository = new GithubRepository(ctx.session.account.repository);
			await githubRepository.createBranch(input.branch.name);
			
			const newBranch = await ctx.prisma.branch.create({
				data: {
					label: input.branch.label,
					name: input.branch.name
				}
			});

			return {...newBranch, commits: []} satisfies BranchItem;
		})
})

export const getBranches = async (ctx: {prisma: Db, githubRepository: GithubRepository}): Promise<BranchItem[]> => {
	const branches = await ctx.prisma.branch.findMany({
		include: {
			pullRequest: true
		}
	});

	return await Promise.all(branches.map(async (branch) => ({
		id: branch.id,
		name: branch.name,
		label: branch.label,
		pullRequestUrl: branch.pullRequest?.url ?? undefined,
		commits: await ctx.githubRepository.getCommits(branch.name)
	}))) satisfies BranchItem[];
}