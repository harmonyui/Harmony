import {
  indexComponentsRequestSchema,
  indexComponentsResponseSchema,
  loadRequestSchema,
  loadResponseSchema,
  publishRequestSchema,
  publishResponseSchema,
  updateRequestBodySchema,
  updateResponseSchema,
} from '@harmony/util/src/types/network'
import type { ComponentUpdate } from '@harmony/util/src/types/component'
import { getComponentIdsFromUpdates } from '@harmony/util/src/updates/utils'
import { getFileContentsFromComponents } from '@harmony/util/src/utils/component'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { getFileContent, updateFileContent } from '../utils/get-files'

const updates: ComponentUpdate[] = []

export const editorRouter = createTRPCRouter({
  loadProject: publicProcedure
    .input(loadRequestSchema)
    .output(loadResponseSchema)
    .query(async ({ ctx, input }) => {
      const ret = await ctx.serverClient.editor.loadProject.query({
        ...input,
        repository: ctx.repository,
      })
      return {
        ...ret,
        updates,
        rootPath: ctx.path,
      }
    }),
  saveProject: publicProcedure
    .input(updateRequestBodySchema)
    .output(updateResponseSchema)
    .mutation(async ({ input }) => {
      updates.push(...input.values.flatMap(({ update }) => update))

      return {
        errorUpdates: [],
      }
    }),
  publishProject: publicProcedure
    .input(publishRequestSchema)
    .output(publishResponseSchema)
    .mutation(async ({ ctx }) => {
      const { path } = ctx

      const componentIds = getComponentIdsFromUpdates(updates)
      const fileContents = await getFileContentsFromComponents(
        componentIds,
        async (file) => getFileContent(file, path),
      )
      const repository =
        ctx.repository ??
        (ctx.repositoryId
          ? await ctx.serverClient.editor.getRepository.query({
              repositoryId: ctx.repositoryId,
            })
          : ctx.repository)
      if (!repository) {
        throw new Error('Repository not found')
      }

      fileContents.push({
        content: getFileContent(repository.config.tailwindPath, path),
        file: repository.config.tailwindPath,
      })

      const codeUpdates = await ctx.serverClient.editor.getCodeUpdates.mutate({
        updates,
        repository: ctx.repository || ctx.repositoryId,
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
    .output(indexComponentsResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const fileContents = await getFileContentsFromComponents(
        input.components,
        async (file) => getFileContent(file, ctx.path),
      )
      return ctx.serverClient.editor.indexComponents.mutate({
        ...input,
        repositoryId: ctx.repository ?? input.repositoryId,
        contents: fileContents.map(({ file, content }) => ({
          path: file,
          content,
        })),
      })
    }),
})
