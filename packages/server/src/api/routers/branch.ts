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
    .input(z.object({ branch: branchItemSchema }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.account.repository) {
        throw new Error('Cannot create a branch without a repository')
      }

      return createBranch({
        prisma: ctx.prisma,
        branch: input.branch,
        repositoryId: ctx.session.account.repository.id,
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

async function createWebpageThumbnail(html: string): Promise<string> {
  const response = await fetch(
    `https://api.microlink.io/?url=${encodeURIComponent(html)}&screenshot=true`,
  )
  const json = await response.json()
  const thumbnailImage = json.data.screenshot.url

  if (!thumbnailImage) {
    // const dataUrl = await domtoimage.toSvg($('body')[0]);
    // thumbnailImage = dataUrl;
    // const base64Encoded = btoa(harmonySVG);

    // // Create a data URL with the Base64-encoded SVG content
    // const dataUrl = `data:image/svg+xml;base64,${base64Encoded}`;
    //const dataUrl = `data:image/svg+xml;utf8, ${harmonySVG}`;
    return '/harmony-project-placeholder.svg'
  }

  return thumbnailImage || ''
}
