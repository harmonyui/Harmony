import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import {
  createWorkspace,
  getWorkspace,
  getWorkspacesForTeam,
  updateWorkspace,
} from '../repository/database/workspace'
import { workspaceSchema } from '@harmony/util/src/types/branch'

export const workspaceRouter = createTRPCRouter({
  getWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    return getWorkspacesForTeam({
      prisma: ctx.prisma,
      teamId: ctx.session.account.teamId,
    })
  }),

  createWorkspace: protectedProcedure
    .input(workspaceSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to the team
      const team = await ctx.prisma.team.findFirst({
        where: {
          id: ctx.session.account.teamId,
          accounts: {
            some: {
              id: ctx.session.account.id,
            },
          },
        },
      })

      if (!team) {
        throw new Error('Team not found or access denied')
      }

      // Create workspace with the repository
      const workspace = await createWorkspace({
        prisma: ctx.prisma,
        name: input.name,
        teamId: ctx.session.account.teamId,
        repository: input.repository,
      })

      return workspace
    }),

  getWorkspace: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspace = await getWorkspace({
        prisma: ctx.prisma,
        workspaceId: input.id,
      })

      if (!workspace) {
        throw new Error('Workspace not found or access denied')
      }

      return workspace
    }),

  updateWorkspace: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspace = await updateWorkspace({
        prisma: ctx.prisma,
        workspaceId: input.id,
        name: input.name,
      })

      if (!workspace) {
        throw new Error('Workspace not found or access denied')
      }

      return workspace
    }),

  // deleteWorkspace: protectedProcedure
  //   .input(z.object({ id: z.string() }))
  //   .mutation(async ({ ctx, input }) => {
  //     const workspace = await ctx.prisma.workspace.findFirst({
  //       where: {
  //         id: input.id,
  //         team: {
  //           accounts: {
  //             some: {
  //               id: ctx.session.account.id,
  //             },
  //           },
  //         },
  //       },
  //     })

  //     if (!workspace) {
  //       throw new Error('Workspace not found or access denied')
  //     }

  //     await ctx.prisma.workspace.delete({
  //       where: {
  //         id: input.id,
  //       },
  //     })

  //     return { success: true }
  //   }),
})
