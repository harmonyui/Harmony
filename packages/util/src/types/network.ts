import { z } from 'zod'
import {
  componentErrorSchema,
  harmonyComponentInfoSchema,
  updateSchema,
} from './component'
import {
  branchItemSchema,
  chatBubbleSchema,
  pullRequestSchema,
  repositorySchema,
} from './branch'
import { emailSchema } from './utils'
import { tokenSchema } from './tokens'

export const updateRequestBodySchema = z.object({
  values: z.array(
    z.object({
      update: z.array(updateSchema),
    }),
  ),
  repositoryId: z.optional(z.string()),
  branchId: z.optional(z.string()),
})
export type UpdateRequest = z.infer<typeof updateRequestBodySchema>

export const updateResponseSchema = z.object({
  errorUpdates: z.array(updateSchema.extend({ errorType: z.string() })),
})
export type UpdateResponse = z.infer<typeof updateResponseSchema>

export const loadRequestSchema = z.object({
  repositoryId: z.optional(z.string()),
  repository: z.optional(repositorySchema),
  branchId: z.optional(z.string()),
})
export type LoadRequest = z.infer<typeof loadRequestSchema>

export const createChatBubbleRequestSchema = z.object({
  branchId: z.string(),
  componentId: z.string(),
  content: z.string(),
  offsetX: z.number(),
  offsetY: z.number(),
})
export type CreateChatBubbleRequest = z.infer<
  typeof createChatBubbleRequestSchema
>

export const createChatBubbleResponseSchema = chatBubbleSchema
export type CreateChatBubbleResponse = z.infer<
  typeof createChatBubbleResponseSchema
>

export const updateChatBubbleRequestSchema = z.object({
  id: z.string(),
  content: z.string(),
  offsetX: z.number(),
  offsetY: z.number(),
})
export type UpdateChatBubbleRequest = z.infer<
  typeof updateChatBubbleRequestSchema
>

export const updateChatBubbleResponseSchema = chatBubbleSchema
export type UpdateChatBubbleResponse = z.infer<
  typeof updateChatBubbleResponseSchema
>

export const deleteChatBubbleRequestSchema = z.object({
  id: z.string(),
})
export type DeleteChatBubbleRequest = z.infer<
  typeof deleteChatBubbleRequestSchema
>

export const deleteChatBubbleResponseSchema = z.object({
  success: z.boolean(),
})
export type DeleteChatBubbleResponse = z.infer<
  typeof deleteChatBubbleResponseSchema
>

export const loadResponseSchema = z.object({
  updates: z.array(updateSchema),
  branches: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      label: z.string(),
    }),
  ),
  pullRequest: z.optional(pullRequestSchema),
  showWelcomeScreen: z.boolean(),
  isDemo: z.boolean(),
  harmonyTokens: z.array(tokenSchema),
  rootPath: z.optional(z.string()),
  chatBubbles: z.array(chatBubbleSchema),
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
  repositoryId: z.union([z.string(), repositorySchema]),
  components: z.array(z.string()),
  contents: z.optional(
    z.array(z.object({ content: z.string(), path: z.string() })),
  ),
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

export const createProjectRequestSchema = z.object({
  name: z.string(),
  url: z.string(),
  repositoryId: z.string(),
})
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>

export const createProjectResponseSchema = branchItemSchema
export type CreateProjectResponse = z.infer<typeof createProjectResponseSchema>

export const codeUpdatesRequestSchema = z.object({
  repository: z.union([z.string(), repositorySchema]),
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

export const createCommentInputSchema = z.object({
  content: z.string(),
  componentId: z.string(),
  offsetX: z.number(),
  offsetY: z.number(),
  branchId: z.string(),
})

export type CreateCommentInput = z.infer<typeof createCommentInputSchema>
