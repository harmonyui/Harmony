import { z } from "zod";
import { componentErrorSchema, updateSchema } from "./component";
import { pullRequestSchema } from "./branch";

export const updateRequestBodySchema = z.object({
	values: z.array(z.object({
		update: z.array(updateSchema),
		//old: z.array(updateSchema)
	})),
	repositoryId: z.string()
})
export type UpdateRequest = z.infer<typeof updateRequestBodySchema>;

export const updateResponseSchema = z.object({
	errorUpdates: z.array(updateSchema.extend({errorType: z.string()}))
});
export type UpdateResponse = z.infer<typeof updateResponseSchema>;

export const loadResponseSchema = z.object({
	updates: z.array(updateSchema),
	branches: z.array(z.object({
		id: z.string(),
		name: z.string()
	})),
	errorElements: z.array(componentErrorSchema),
	isPublished: z.boolean()
});
export type LoadResponse = z.infer<typeof loadResponseSchema>;

export const publishRequestSchema = z.object({
	pullRequest: z.object({
		title: z.string(),
		body: z.string()
	}),
	branchId: z.string(),
})
export type PublishRequest = z.infer<typeof publishRequestSchema>;