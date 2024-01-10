import { z } from "zod";

export const branchItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	label: z.string(),
})

export type BranchItem = z.infer<typeof branchItemSchema>;