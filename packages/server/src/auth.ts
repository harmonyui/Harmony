import { clerkClient } from '@clerk/nextjs'
import { z } from 'zod'
import { prisma } from '@harmony/db/lib/prisma'
import type { Repository } from '@harmony/util/src/types/branch'
import {
  repositorySchema,
  workspaceSchema,
} from '@harmony/util/src/types/branch'
import { emailSchema } from '@harmony/util/src/types/utils'
import { getDefaultWorkspace } from './api/repository/database/workspace'

export interface User {
  id: string
  name: string
  image: string
  email: string
}

export const accountSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  repository: z.optional(repositorySchema),
  workspace: z.optional(workspaceSchema),
  teamId: z.string(),
  contact: emailSchema,
  seenWelcomeScreen: z.boolean(),
})

export type Account = z.infer<typeof accountSchema>

export interface AuthContext {
  userId: string
  //oauthToken: string;
  user: User
  role: string
}

export interface FullSession {
  auth: AuthContext
  account: Account
}

export type Session =
  | {
      auth: AuthContext
      account: Account | undefined
    }
  | FullSession

export const getRepositoryFromTeam = async (
  teamId: string,
): Promise<Repository | undefined> => {
  return (await getDefaultWorkspace({ prisma, teamId }))?.repository
}

export const getAccount = async (
  userId: string,
): Promise<Account | undefined> => {
  const account = await prisma.account.findFirst({
    where: {
      userId,
    },
    include: {
      team: true,
    },
  })

  if (account === null) return undefined

  const repository: Repository | undefined = await getRepositoryFromTeam(
    account.team_id,
  )

  return {
    id: account.id,
    firstName: account.firstName,
    lastName: account.lastName,
    repository,
    role: account.role,
    teamId: account.team_id,
    contact: emailSchema.parse(account.contact),
    seenWelcomeScreen: account.seen_welcome_screen,
    workspace:
      (await getDefaultWorkspace({ prisma, teamId: account.team_id })) ??
      undefined,
  }
}

const getRole = async (id: string): Promise<string> => {
  const user = await prisma.user.findFirst({
    where: {
      id,
    },
  })

  if (user === null) return 'user'
  return user.role
}

export const getServerAuthSession = async (
  userId: string | null,
  mockUserId?: string,
): Promise<Session | undefined> => {
  //const {userId} = auth()// : {userId: null};
  //const {userId} = _auth;
  let ourAuth: AuthContext | null = null

  if (userId) {
    const user = await clerkClient.users.getUser(userId)

    if (!user.emailAddresses[0].emailAddress) {
      throw new Error('User does not have an email address')
    }
    const email = user.emailAddresses[0].emailAddress
    const role = await getRole(email)
    ourAuth = {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        image: user.imageUrl,
        email,
      },
      userId,
      role,
    }
  }

  const userIdToUse = mockUserId !== 'none' ? mockUserId || userId : null
  const account: Account | undefined =
    ourAuth && userIdToUse ? await getAccount(userIdToUse) : undefined

  if (account?.contact === 'example@gmail.com' && ourAuth) {
    account.contact = emailSchema.parse(ourAuth.user.email)
    await prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        contact: ourAuth.user.email,
      },
    })
  }

  return ourAuth
    ? {
        auth: ourAuth,
        account,
      }
    : undefined
}
