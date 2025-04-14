import { emailSchema } from '@harmony/util/src/types/utils'
import type { TeamMember } from '@harmony/util/src/types/branch'
import { withAuth } from '../../../../utils/protected-routes-hoc'
import { TeamDisplay } from './components/team'

const TeamPage = withAuth(async ({ ctx }) => {
  const team = await ctx.prisma.team.findUnique({
    where: {
      id: ctx.session.account.teamId,
    },
    include: {
      accounts: true,
    },
  })
  if (!team) {
    throw new Error(`Invalid team id ${ctx.session.account.teamId}`)
  }
  const members: TeamMember[] = team.accounts.map((account) => ({
    id: account.id,
    name: `${account.firstName} ${account.lastName}`,
    role: account.role,
    contact: emailSchema.parse(account.contact),
  }))

  return <TeamDisplay members={members} />
})

export default TeamPage
