import { z } from "zod";
import { updateSchema } from "./component";

export const updateRequestBodySchema = z.object({
	commands: z.array(z.object({
		id: z.string(),
		parentId: z.string(),
		old: z.array(updateSchema),
		updates: z.array(updateSchema),
	})),
	repositoryId: z.string()
})
export type UpdateRequest = z.infer<typeof updateRequestBodySchema>;

export const loadResponseSchema = z.object({
	updates: z.array(updateSchema),
	branches: z.array(z.object({
		id: z.string(),
		name: z.string()
	}))
});
export type LoadResponse = z.infer<typeof loadResponseSchema>;