import { z } from "zod";
import { componentErrorSchema, harmonyComponentInfoSchema, updateSchema } from "./component";
import { pullRequestSchema } from "./branch";
import { emailSchema } from "./utils";

export const updateRequestBodySchema = z.object({
	values: z.array(z.object({
		update: z.array(updateSchema),
	})),
	repositoryId: z.string(),
	branchId: z.string()
})
export type UpdateRequest = z.infer<typeof updateRequestBodySchema>;

export const updateResponseSchema = z.object({
	errorUpdates: z.array(updateSchema.extend({errorType: z.string()}))
});
export type UpdateResponse = z.infer<typeof updateResponseSchema>;


export const loadRequestSchema = z.object({
	repositoryId: z.string(),
	branchId: z.string()
})
export type LoadRequest = z.infer<typeof loadRequestSchema>;
export const loadResponseSchema = z.object({
	updates: z.array(updateSchema),
	branches: z.array(z.object({
		id: z.string(),
		name: z.string()
	})),
	harmonyComponents: z.array(harmonyComponentInfoSchema),
	errorElements: z.array(componentErrorSchema),
	pullRequest: z.optional(pullRequestSchema),
	showWelcomeScreen: z.boolean(),
	isDemo: z.boolean()
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

export const publishResponseSchema = z.object({
	pullRequest: pullRequestSchema
});
export type PublishResponse = z.infer<typeof publishResponseSchema>;

export const emailFeedbackRequestSchema = z.object({
	name: z.string(),
	comments: z.string()
});
export type EmailFeedbackRequest = z.infer<typeof emailFeedbackRequestSchema>;

export const emailMeetingRequestSchema = z.object({
	name: z.string(),
	email: emailSchema,
	comments: z.string()
});
export type EmailMeetingRequest = z.infer<typeof emailMeetingRequestSchema>;