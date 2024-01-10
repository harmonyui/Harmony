import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { branchItemSchema } from "@harmony/types/branch";
import { createBranch } from "../services/updator/github";

export const branchRoute = createTRPCRouter({
	getBranches: protectedProcedure
		.query(async ({ctx}) => {
			const branches = await ctx.prisma.branch.findMany();

			return branches;
		}),
	createBranch: protectedProcedure
		.input(z.object({branch: branchItemSchema}))
		.mutation(async ({ctx, input}) => {
			await createBranch('bradofrado', 'Harmony', 'master', input.branch.name);
			const newBranch = await ctx.prisma.branch.create({
				data: {
					label: input.branch.label,
					name: input.branch.name
				}
			});

			return newBranch;
		})
})