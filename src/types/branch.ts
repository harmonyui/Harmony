import { z } from "zod";

export const branchItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	label: z.string(),
})

export type BranchItem = z.infer<typeof branchItemSchema>;

export const repositorySchema = z.object({
	id: z.string(),
	name: z.string(),
	owner: z.string(),
	branch: z.string(),
})

export type Repository = z.infer<typeof repositorySchema>;