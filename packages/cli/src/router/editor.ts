import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../trpc'
import {
  createUpdateFromTextRequestSchema,
  createUpdateFromTextResponseSchema,
  indexComponentsRequestSchema,
  indexComponentsResponseSchema,
  loadRequestSchema,
  loadResponseSchema,
  publishRequestSchema,
  publishResponseSchema,
  updateRequestBodySchema,
  updateResponseSchema,
} from '@harmony/util/src/types/network'
import { ComponentUpdate } from '@harmony/util/src/types/component'
import { getComponentIdsFromUpdates } from '@harmony/util/src/updates/utils'
import { getFileContentsFromComponents } from '@harmony/util/src/utils/component'
import { getFileContent, updateFileContent } from '../utils/get-files'

const updates: ComponentUpdate[] = []

export const editorRouter = createTRPCRouter({
  loadProject: publicProcedure
    .input(loadRequestSchema)
    .output(loadResponseSchema)
    .query(async ({ ctx, input }) => {
      const ret = await ctx.serverClient.editor.loadProject.query(input)
      return {
        ...ret,
        updates,
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
      const repository = await ctx.serverClient.editor.getRepository.query({
        repositoryId: ctx.repositoryId,
      })
      fileContents.push({
        content: await getFileContent(repository.config.tailwindPath, path),
        file: repository.config.tailwindPath,
      })

      const codeUpdates = await ctx.serverClient.editor.getCodeUpdates.mutate({
        updates,
        repositoryId: ctx.repositoryId,
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
      return ctx.serverClient.editor.indexComponents.mutate(input)
    }),
})
