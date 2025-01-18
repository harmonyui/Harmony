/* eslint-disable @typescript-eslint/consistent-indexed-object-style -- ok*/
import { notFound } from 'next/navigation'
import React from 'react'
import { prisma } from '@harmony/db/lib/prisma'
import { getServerAuthSession } from '@harmony/server/src/auth'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { WelcomeDisplay } from './components/setup'

export default async function SetupPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
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

  const cookie = await cookies()
  const { userId } = await auth()
  const mockUserId = cookie.get('harmony-user-id')?.value
  const authSession = await getServerAuthSession(userId, mockUserId)

  return (
    <WelcomeDisplay
      teamId={teamId}
      account={authSession?.account}
      isNewMockAccount={mockUserId === 'none'}
    />
  )
}
