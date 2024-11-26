import { prisma } from '@harmony/db/lib/prisma'
import { withAuth } from '../../../utils/protected-routes-hoc'
import { PullRequestDisplay } from './components/pull-request'

const PullRequestPage = withAuth(async ({ ctx }) => {
  const pullRequests = await prisma.pullRequest.findMany({
    where: {
      repository_id: ctx.session.account.repository?.id,
    },
  })

  return <PullRequestDisplay items={pullRequests} />
})

export default PullRequestPage
