import { getDefaultWorkspace } from '@harmony/server/src/api/repository/database/workspace'
import { withAuth } from '../../../../utils/protected-routes-hoc'
import { redirect } from 'next/navigation'

const PullRequestsPage = withAuth(async ({ ctx }) => {
  const defaultWorkspace = await getDefaultWorkspace({
    prisma: ctx.prisma,
    teamId: ctx.session.account.teamId,
  })
  if (!defaultWorkspace) {
    redirect('/setup')
  }
  redirect(`/${defaultWorkspace.id}/pull-requests`)
})

export default PullRequestsPage
