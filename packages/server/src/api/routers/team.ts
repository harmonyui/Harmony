import { teamMemberSchema } from '@harmony/util/src/types/branch'
import { z } from 'zod'
import { WEB_URL } from '@harmony/util/src/constants'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const teamRouter = createTRPCRouter({
  sendNewMemberInvite: protectedProcedure
    .input(z.object({ teamMember: teamMemberSchema }))
    .mutation(async ({ ctx, input }) => {
      const url = `${WEB_URL}/setup?teamId=${ctx.session.account.teamId}`

      const subject = 'Harmony Invite'
      const message = `Hey ${input.teamMember.name}!
            You just got invited to a team on Harmony. 
            Click <a href="${url}">here</a> to make an account and start designing inside of your existing application!`

      await ctx.mailer.sendMail({
        to: input.teamMember.contact,
        subject,
        body: message,
      })
    }),
})
