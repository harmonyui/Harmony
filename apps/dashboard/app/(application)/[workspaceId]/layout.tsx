import { getWorkspacesForTeam } from '@harmony/server/src/api/repository/database/workspace'
import { SideNav } from '../../../utils/side-nav'
import { getServerAuthSession } from '@harmony/server/src/auth'
import { prisma } from '@harmony/db/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}) {
  const { userId } = await auth()
  const session = await getServerAuthSession(userId)
  if (!session?.account) {
    notFound()
  }
  const { workspaceId } = await params
  const workspaces = session.account
    ? await getWorkspacesForTeam({
        prisma,
        teamId: session.account.teamId,
      })
    : []
  return (
    <SideNav
      workspaces={workspaces}
      currentWorkspaceId={workspaceId ?? session.account.workspace?.id ?? ''}
      teamId={session.account.teamId}
    >
      {children}
    </SideNav>
  )
}
