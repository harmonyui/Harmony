import { prisma } from '@harmony/db/lib/prisma'
import { ModalProvider } from '@harmony/ui/src/components/core/modal'
import { SideNav } from '../../utils/side-nav'
import { withAuth } from '../../utils/protected-routes-hoc'
import { PullRequestDisplay } from './components/pull-request'

const PullRequestPage = withAuth(async () => {
  const pullRequests = await prisma.pullRequest.findMany()

  return (
    <ModalProvider>
      <SideNav>
        <PullRequestDisplay items={pullRequests} />
      </SideNav>
    </ModalProvider>
  )
})

export default PullRequestPage
