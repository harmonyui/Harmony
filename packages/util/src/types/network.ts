import { z } from 'zod'
import {
  componentErrorSchema,
  harmonyComponentInfoSchema,
  updateSchema,
} from './component'
import { pullRequestSchema } from './branch'
import { emailSchema } from './utils'
import { tokenSchema } from './tokens'

export const updateRequestBodySchema = z.object({
  values: z.array(
    z.object({
      update: z.array(updateSchema),
    }),
  ),
  repositoryId: z.optional(z.string()),
  branchId: z.string(),
})
export type UpdateRequest = z.infer<typeof updateRequestBodySchema>

export const updateResponseSchema = z.object({
  errorUpdates: z.array(updateSchema.extend({ errorType: z.string() })),
})
export type UpdateResponse = z.infer<typeof updateResponseSchema>

export const loadRequestSchema = z.object({
  repositoryId: z.optional(z.string()),
  branchId: z.string(),
})
export type LoadRequest = z.infer<typeof loadRequestSchema>
export const loadResponseSchema = z.object({
  updates: z.array(updateSchema),
  branches: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
  pullRequest: z.optional(pullRequestSchema),
  showWelcomeScreen: z.boolean(),
  isDemo: z.boolean(),
  harmonyTokens: z.array(tokenSchema),
})
export type LoadResponse = z.infer<typeof loadResponseSchema>

export const publishRequestSchema = z.object({
  pullRequest: z.object({
    title: z.string(),
    body: z.string(),
  }),
  branchId: z.string(),
})
export type PublishRequest = z.infer<typeof publishRequestSchema>

export const publishResponseSchema = z.object({
  pullRequest: z.optional(pullRequestSchema),
})
export type PublishResponse = z.infer<typeof publishResponseSchema>

export const indexComponentsRequestSchema = z.object({
  branchId: z.string(),
  repositoryId: z.string(),
  components: z.array(z.string()),
})
export type IndexComponentsRequest = z.infer<
  typeof indexComponentsRequestSchema
>

export const indexComponentsResponseSchema = z.object({
  harmonyComponents: z.array(harmonyComponentInfoSchema),
  errorElements: z.array(componentErrorSchema),
})
export type IndexComponentsResponse = z.infer<
  typeof indexComponentsResponseSchema
>

export const codeUpdatesRequestSchema = z.object({
  repositoryId: z.string(),
  updates: z.array(updateSchema),
  contents: z.array(
    z.object({
      content: z.string(),
      path: z.string(),
    }),
  ),
})
export type CodeUpdatesRequest = z.infer<typeof codeUpdatesRequestSchema>
export const codeUpdatesResponseSchema = z.array(
  z.object({
    content: z.string(),
    path: z.string(),
  }),
)
export type CodeUpdatesResponse = z.infer<typeof codeUpdatesResponseSchema>

export const emailFeedbackRequestSchema = z.object({
  name: z.string(),
  comments: z.string(),
})
export type EmailFeedbackRequest = z.infer<typeof emailFeedbackRequestSchema>

export const emailMeetingRequestSchema = z.object({
  name: z.string(),
  email: emailSchema,
  comments: z.string(),
})
export type EmailMeetingRequest = z.infer<typeof emailMeetingRequestSchema>

export const createUpdateFromTextRequestSchema = z.object({
  text: z.string(),
  componentId: z.string(),
  childIndex: z.number(),
  currentAttributes: z.array(z.object({ name: z.string(), value: z.string() })),
})
export type CreateUpdateFromTextRequest = z.infer<
  typeof createUpdateFromTextRequestSchema
>
export const createUpdateFromTextResponseSchema = z.array(updateSchema)

export type CreateUpdateFromTextResponse = z.infer<
  typeof createUpdateFromTextResponseSchema
>
