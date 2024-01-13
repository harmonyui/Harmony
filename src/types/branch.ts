import { z } from "zod";

export const commitSchema = z.object({
	author: z.string(),
	message: z.string(),
	date: z.date()
});

export type CommitItem = z.infer<typeof commitSchema>;

export const branchItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	label: z.string(),
	commits: z.array(commitSchema)
})

export type BranchItem = z.infer<typeof branchItemSchema>;

export const repositorySchema = z.object({
	id: z.string(),
	name: z.string(),
	owner: z.string(),
	branch: z.string(),
	installationId: z.number(),
})

export type Repository = z.infer<typeof repositorySchema>;