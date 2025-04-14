import { getWorkspacesForTeam } from '@harmony/server/src/api/repository/database/workspace'
import { SideNav } from '../../../utils/side-nav'
import { getServerAuthSession } from '@harmony/server/src/auth'
import { prisma } from '@harmony/db/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  const session = await getServerAuthSession(userId)
  if (!session?.account) {
    notFound()
  }

  return <SideNav teamId={session.account.teamId}>{children}</SideNav>
}
