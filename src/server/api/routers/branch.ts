import { z } from "zod";
import { AuthContext, CreateContext, createTRPCRouter, protectedProcedure } from "../trpc";
import { BranchItem, branchItemSchema } from "../../../../packages/ui/src/types/branch";
import { GithubRepository } from "../repository/github";
import { Db } from "../../../../src/server/db";
import { compare } from "@harmony/util/src";

export const branchRoute = createTRPCRouter({
	getBranches: protectedProcedure
		.query(async ({ctx}) => {
			if (!ctx.session.account.repository) {
				return undefined;
			}

			return getBranches({prisma: ctx.prisma, repositoryId: ctx.session.account.repository.id}, new GithubRepository(ctx.session.account.repository))
		}),
	createBranch: protectedProcedure
		.input(z.object({branch: branchItemSchema}))
		.mutation(async ({ctx, input}) => {
			if (!ctx.session.account.repository) {
				throw new Error("Cannot create a branch without a repository");
			}

			const githubRepository = new GithubRepository(ctx.session.account.repository);
			await githubRepository.createBranch(input.branch.name);
			
			const newBranch = await ctx.prisma.branch.create({
				data: {
					repository_id: ctx.session.account.repository.id,
					label: input.branch.label,
					name: input.branch.name,
					url: input.branch.url
				},
				include: {
					updates: true
				}
			});

			const lastUpdated = newBranch.updates.sort((a, b) => compare(b.date_modified, a.date_modified))[0].date_modified;

			return {
				id: newBranch.id,
				label: newBranch.label,
				name: newBranch.name,
				url: newBranch.url, 
				commits: [], 
				lastUpdated
			} satisfies BranchItem;
		})
})

export const getBranches = async ({prisma, repositoryId}: {prisma: Db, repositoryId: string}, githubRepository: GithubRepository): Promise<BranchItem[]> => {
	const branches = await prisma.branch.findMany({
		where: {
			repository_id: repositoryId,
		},
		include: {
			pullRequest: true,
			updates: true
		}
	});

	return await Promise.all(branches.map(async (branch) => ({
		id: branch.id,
		name: branch.name,
		label: branch.label,
		url: branch.url,
		pullRequestUrl: branch.pullRequest?.url ?? undefined,
		commits: await githubRepository.getCommits(branch.name),
		lastUpdated: branch.updates.sort((a, b) => compare(b.date_modified, a.date_modified))[0].date_modified
	}))) satisfies BranchItem[];
}

export const getBranch = async({prisma, branchId}: {prisma: Db, branchId: string}) => {
	const branch = await prisma.branch.findUnique({
		where: {
			id: branchId,
		},
		include: {
			pullRequest: true,
			updates: true
		}
	});

	if (!branch) return undefined;

	//TODO: Get rid of hacky repository id addition and make that global
	return {
		id: branch.id,
		name: branch.name,
		label: branch.label,
		url: branch.url,
		repositoryId: branch.repository_id,
		pullRequestUrl: branch.pullRequest?.url ?? undefined,
		commits: [],//await githubRepository.getCommits(branch.name),
		lastUpdated: branch.updates.sort((a, b) => compare(b.date_modified, a.date_modified))[0].date_modified
	} satisfies BranchItem & {repositoryId: string};
}