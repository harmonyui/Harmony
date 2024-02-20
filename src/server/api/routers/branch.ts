import { z } from "zod";
import { AuthContext, CreateContext, createTRPCRouter, protectedProcedure } from "../trpc";
import { BranchItem, branchItemSchema } from "../../../../packages/ui/src/types/branch";
import { GithubRepository } from "../repository/github";
import { Db } from "../../../../src/server/db";
import { compare } from "@harmony/util/src";
import { ComponentUpdate } from "@harmony/ui/src/types/component";
import { Prisma } from "@prisma/client";

const branchPayload = {
	include: {
		pullRequest: true,
		updates: {
			orderBy: {
				date_modified: 'desc'
			}
		}
	}
} satisfies Prisma.BranchDefaultArgs
type Branch = Prisma.BranchGetPayload<typeof branchPayload>;

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
			
			const newBranch = await ctx.prisma.branch.create({
				data: {
					repository_id: ctx.session.account.repository.id,
					label: input.branch.label,
					name: input.branch.name,
					url: input.branch.url
				},
				...branchPayload
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
		...branchPayload
	});

	

	return await Promise.all(branches.map(branch => prismaToBranch(branch))) satisfies BranchItem[];
}

const getLastUpdated = (branch: Branch): Date => {
	if (branch.updates.length) {
		return branch.updates.sort((a, b) => compare(b.date_modified, a.date_modified))[0].date_modified
	}

	return branch.date_modified;
} 

const prismaToBranch = (branch: Branch): BranchItem => {
	

	return {
		id: branch.id,
		name: branch.name,
		label: branch.label,
		url: branch.url,
		pullRequestUrl: branch.pullRequest?.url ?? undefined,
		commits: [],
		lastUpdated: getLastUpdated(branch)
	}
}

export const getBranch = async({prisma, branchId}: {prisma: Db, branchId: string}) => {
	const branch = await prisma.branch.findUnique({
		where: {
			id: branchId,
		},
		...branchPayload
	});

	if (!branch) return undefined;

	//TODO: Get rid of hacky property additions and make that global
	return {
		id: branch.id,
		name: branch.name,
		label: branch.label,
		url: branch.url,
		repositoryId: branch.repository_id,
		pullRequestUrl: branch.pullRequest?.url ?? undefined,
		commits: [],//await githubRepository.getCommits(branch.name),
		lastUpdated: getLastUpdated(branch),
		updates: branch.updates.map(update => ({
			action: update.action as ComponentUpdate['action'],
			type: update.type as ComponentUpdate['type'],
			name: update.name,
			value: update.value,
			componentId: update.component_id,
			parentId: update.component_parent_id
		})),
		old: branch.updates.map(update => update.old_value)
	} satisfies BranchItem & {repositoryId: string, updates: ComponentUpdate[], old: string[]};
}