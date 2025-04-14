import { prisma } from '@harmony/db/lib/prisma'
import { withWorkspace } from '../../../../utils/protected-routes-hoc'
import { PullRequestDisplay } from './components/pull-request'

const PullRequestPage = withWorkspace(async ({ workspace }) => {
  const pullRequests = await prisma.pullRequest.findMany({
    where: {
      repository_id: workspace.repository.id,
    },
  })

  return <PullRequestDisplay items={pullRequests} />
})

export default PullRequestPage
