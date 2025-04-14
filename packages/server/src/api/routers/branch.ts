/* eslint-disable @typescript-eslint/no-unused-vars -- ok*/

import { z } from 'zod'
import { branchItemSchema } from '@harmony/util/src/types/branch'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { createBranch, getBranches } from '../repository/database/branch'

export const branchRoute = createTRPCRouter({
  getBranches: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.account.repository) {
      return undefined
    }

    return getBranches({
      prisma: ctx.prisma,
      repositoryId: ctx.session.account.repository.id,
    })
  }),
  createBranch: protectedProcedure
    .input(
      z.object({
        branch: branchItemSchema,
        repositoryId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.account.repository) {
        throw new Error('Cannot create a branch without a repository')
      }

      return createBranch({
        prisma: ctx.prisma,
        branch: input.branch,
        repositoryId: input.repositoryId ?? ctx.session.account.repository.id,
        accountId: ctx.session.account.id,
      })
    }),
  deleteBranch: protectedProcedure
    .input(z.object({ branchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.branch.update({
        where: {
          id: input.branchId,
        },
        data: {
          is_deleted: true,
        },
      })
    }),
  getURLThumbnail: publicProcedure
    .input(z.object({ url: z.string() }))
    .query(async ({ ctx, input }) => {
      const response = await fetch(input.url, {
        method: 'GET',
      })
      const html = await response.text()

      return createWebpageThumbnail(html)
    }),
})

const microLinkResponseSchema = z.object({
  data: z.object({
    screenshot: z.object({
      url: z.string().optional(),
    }),
  }),
})
const placeholder = '/harmony-project-placeholder.svg'
async function createWebpageThumbnail(url: string): Promise<string> {
  try {
    const response = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true`,
    )
    const responseData = microLinkResponseSchema.parse(await response.json())

    const thumbnailImage = responseData.data.screenshot.url

    if (!thumbnailImage) {
      return placeholder
    }

    return thumbnailImage || ''
  } catch (error) {
    console.error('Error creating thumbnail', error)
    return placeholder
  }
}
