import { getDefaultWorkspace } from '@harmony/server/src/api/repository/database/workspace'
import { withAuth } from '../../../../utils/protected-routes-hoc'
import { redirect } from 'next/navigation'

const ProjectsPage = withAuth(async ({ ctx }) => {
  const defaultWorkspace = await getDefaultWorkspace({
    prisma: ctx.prisma,
    teamId: ctx.session.account.teamId,
  })
  if (!defaultWorkspace) {
    redirect('/setup')
  }
  redirect(`/${defaultWorkspace.id}/projects`)
})

export default ProjectsPage
