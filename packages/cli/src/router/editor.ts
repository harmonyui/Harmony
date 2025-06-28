import {
  createChatBubbleRequestSchema,
  createChatBubbleResponseSchema,
  deleteChatBubbleRequestSchema,
  deleteChatBubbleResponseSchema,
  indexComponentsRequestSchema,
  loadRequestSchema,
  publishRequestSchema,
  updateChatBubbleRequestSchema,
  updateChatBubbleResponseSchema,
  updateRequestBodySchema,
} from '@harmony/util/src/types/network'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { getComponentIdsFromUpdates } from '@harmony/util/src/updates/utils'
import { getFileContentsFromComponents } from '@harmony/util/src/utils/component'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { getFileContent, updateFileContent } from '../utils/get-files'
import { ChatBubble } from '@harmony/util/src/types/branch'
import { generateUniqueId } from '@harmony/util/src/utils/common'

const updates: ComponentUpdate[] = []
const chatBubbles: ChatBubble[] = []

export const editorRouter = createTRPCRouter({
  loadProject: publicProcedure
    .input(loadRequestSchema)
    .query(async ({ ctx, input }) => {
      const ret = await ctx.serverClient.editor.loadProject.query({
        ...input,
        repositoryConfig: ctx.repositoryConfig,
      })
      return {
        ...ret,
        updates,
        chatBubbles,
        rootPath: ctx.path,
      }
    }),
  saveProject: publicProcedure
    .input(updateRequestBodySchema)
    .mutation(async ({ input }) => {
      updates.push(...input.values.flatMap(({ update }) => update))

      return {
        errorUpdates: [],
      }
    }),
  publishProject: publicProcedure
    .input(publishRequestSchema)
    .mutation(async ({ ctx }) => {
      const { path } = ctx

      const componentIds = getComponentIdsFromUpdates(updates)
      const fileContents = await getFileContentsFromComponents(
        componentIds,
        async (file) => getFileContent(file, path),
      )
      const repositoryConfig =
        ctx.repositoryConfig ??
        (ctx.repositoryId
          ? (
              await ctx.serverClient.editor.getRepository.query({
                repositoryId: ctx.repositoryId,
              })
            ).config
          : ctx.repositoryConfig)
      if (!repositoryConfig) {
        throw new Error('Repository not found')
      }

      fileContents.push({
        content: getFileContent(repositoryConfig.tailwindPath, path),
        file: repositoryConfig.tailwindPath,
      })

      const codeUpdates = await ctx.serverClient.editor.getCodeUpdates.mutate({
        updates,
        repositoryConfig,
        contents: fileContents.map(({ file, content }) => ({
          path: file,
          content,
        })),
      })

      await Promise.all(
        codeUpdates.map(({ path: file, content }) =>
          updateFileContent(file, path, content),
        ),
      )
      updates.splice(0, updates.length)

      return {}
    }),
  indexComponents: publicProcedure
    .input(indexComponentsRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const fileContents = await getFileContentsFromComponents(
        input.components,
        async (file) => getFileContent(file, ctx.path),
      )
      return ctx.serverClient.editor.indexComponents.mutate({
        ...input,
        repositoryId: ctx.repositoryConfig ?? input.repositoryId,
        contents: fileContents.map(({ file, content }) => ({
          path: file,
          content,
        })),
      })
    }),

  createChatBubble: publicProcedure
    .input(createChatBubbleRequestSchema)
    .output(createChatBubbleResponseSchema)
    .mutation(async ({ input }) => {
      const newChatBubble = { id: generateUniqueId(), ...input }
      chatBubbles.push(newChatBubble)

      return newChatBubble
    }),

  updateChatBubble: publicProcedure
    .input(updateChatBubbleRequestSchema)
    .output(updateChatBubbleResponseSchema)
    .mutation(async ({ input }) => {
      const chatBubble = chatBubbles.find((cb) => cb.id === input.id)
      if (!chatBubble) {
        throw new Error('Chat bubble not found')
      }
      chatBubble.content = input.content
      chatBubble.offsetX = input.offsetX
      chatBubble.offsetY = input.offsetY
      return chatBubble
    }),

  deleteChatBubble: publicProcedure
    .input(deleteChatBubbleRequestSchema)
    .output(deleteChatBubbleResponseSchema)
    .mutation(async ({ input }) => {
      const chatBubble = chatBubbles.find((cb) => cb.id === input.id)
      if (!chatBubble) {
        throw new Error('Chat bubble not found')
      }
      chatBubbles.splice(chatBubbles.indexOf(chatBubble), 1)
      return { success: true }
    }),
})
