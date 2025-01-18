import { notFound, redirect } from 'next/navigation'
import { getServerAuthSession } from '@harmony/server/src/auth'
import { prisma } from '@harmony/db/lib/prisma'
import { createNewAccount } from '@harmony/server/src/api/routers/setup'
import { wordToKebabCase } from '@harmony/util/src/utils/common'
import { auth } from '@clerk/nextjs/server'
import { createUrlFromProject } from '@harmony/util/src/utils/component'
import {
  createBranch,
  getBranches,
} from '@harmony/server/src/api/repository/database/branch'
import { DesignerSetup } from '../components/setup'

async function QuickPage({
  searchParams: unawaitedParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await unawaitedParams
  const teamId = searchParams?.teamId || undefined

  if (teamId && typeof teamId === 'string') {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
    })
    if (!team) {
      notFound()
    }
  }

  if (teamId && typeof teamId !== 'string') {
    notFound()
  }

  const { userId } = await auth()
  const session = await getServerAuthSession(userId)
  if (!session) {
    notFound()
  }

  if (!session.account) {
    const account = await createNewAccount({
      prisma,
      account: {
        firstName: session.auth.user.name,
        lastName: session.auth.user.name,
        role: 'quick',
      },
      userId: session.auth.userId,
      teamId,
      email: session.auth.user.email,
    })
    session.account = account
  }

  if (!session.account.repository) {
    return <DesignerSetup teamId={session.account.teamId} />
  }

  const repositoryId = session.account.repository.id
  const accountId = session.account.id
  const branches = await getBranches({ prisma, repositoryId, accountId })
  let firstBranch = branches[0]
  if (!firstBranch) {
    const newBranch = await createBranch({
      prisma,
      branch: {
        id: '',
        label: session.auth.user.name,
        name: wordToKebabCase(session.auth.user.name),
        commits: [],
        lastUpdated: new Date(),
        url: session.account.repository.defaultUrl,
      },
      repositoryId,
      accountId,
    })
    firstBranch = newBranch
  }

  const url = createUrlFromProject(firstBranch)

  redirect(url.href)
}

export default QuickPage
