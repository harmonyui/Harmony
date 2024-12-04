/* eslint-disable @typescript-eslint/no-shadow -- ok */
import crypto from 'node:crypto'
import { z } from 'zod'
import type { Repository } from '@harmony/util/src/types/branch'
import { repositorySchema } from '@harmony/util/src/types/branch'
import type { components } from '@octokit/openapi-types/types'
import { emailSchema } from '@harmony/util/src/types/utils'
import { cookies } from 'next/headers'
import type { Db } from '@harmony/db/lib/prisma'
import { getAccount, getRepositoryFromTeam } from '../../auth'
import type { Account } from '../../auth'
import { appOctokit } from '../repository/git/github'
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  registerdProcedure,
} from '../trpc'

const accountCreateSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
})
type AccountCreate = z.infer<typeof accountCreateSchema>

const createSetupSchema = z.object({
  account: accountCreateSchema,
  teamId: z.optional(z.string()),
  userId: z.optional(z.string()),
})

export const setupRoute = createTRPCRouter({
  getAccount: registerdProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.auth.userId

    return getAccount(userId)
    // const account = await ctx.prisma.account.findFirst({
    // 	where: {
    // 		userId
    // 	}
    // });
    // if (!account) return undefined;

    // return {
    // 	firstName: account.firstName,
    // 	lastName: account.lastName,
    // 	role: account.role,
    // }
  }),
  createAccount: registerdProcedure
    .input(createSetupSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.auth.userId

      const cookie = cookies()
      cookie.set('harmony-user-id', userId)

      return createNewAccount({
        prisma: ctx.prisma,
        email: ctx.session.auth.user.email,
        account: input.account,
        teamId: input.teamId,
        userId,
      })
    }),
  sendDeveloperEmail: protectedProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async () => {
      //const email = input.email;
    }),
  connectRepository: publicProcedure
    .input(z.object({ repository: repositorySchema, teamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const teamId = input.teamId
      const newRepository = await ctx.prisma.repository.create({
        data: {
          id: input.repository.id,
          branch: input.repository.branch,
          name: input.repository.name,
          owner: input.repository.owner,
          ref: input.repository.ref,
          installationId: input.repository.installationId,
          team_id: teamId,
          css_framework: input.repository.cssFramework,
          tailwind_prefix: input.repository.tailwindPrefix,
          tailwind_config: input.repository.tailwindConfig,
          default_url: input.repository.defaultUrl,
        },
      })

      return {
        id: newRepository.id,
        branch: newRepository.branch,
        installationId: newRepository.installationId,
        name: newRepository.name,
        owner: newRepository.owner,
        ref: newRepository.ref,
        tailwindPrefix: newRepository.tailwind_prefix || undefined,
        cssFramework: newRepository.css_framework,
        defaultUrl: newRepository.default_url,
        tailwindConfig: newRepository.tailwind_config,
        registry: {},
      } satisfies Repository
    }),
  // importRepository: protectedProcedure
  // 	.input(z.object({repository: repositorySchema}))
  // 	.mutation(async ({ctx, input}) => {
  // 		const accountId = ctx.session.account.id;

  // 		const newRepository = await ctx.prisma.repository.create({
  // 			data: {
  // 				id: input.repository.id ?? undefined,
  // 				branch: input.repository.branch,
  // 				name: input.repository.name,
  // 				owner: input.repository.owner,
  // 				installationId: input.repository.installationId,
  // 				account_id: accountId
  // 			}
  // 		});

  // 	}),
  getRepositories: publicProcedure
    .input(z.object({ accessToken: z.string() }))
    .query(async ({ input }) => {
      //const {data} = await appOctokit.request('GET /app/installations');

      //const username = ctx.session.auth.user.username;
      const accessToken = input.accessToken
      //const {data} = await appOctokit.request('GET /user/installations');
      const response = await fetch(
        'https://api.github.com/user/installations',
        {
          method: 'GET',
          headers: {
            authorization: `token ${accessToken}`,
          },
        },
      )
      if (!response.ok) {
        const json: unknown = await response.json()
        throw new Error(String(json))
      }
      const data = (await response.json()) as {
        installations: components['schemas']['installation'][]
      }
      const currentInstallations = data.installations //.filter(inst => inst.account?.login === '');

      if (currentInstallations.length === 0) {
        return []
      }

      const accessTokens = await Promise.all(
        currentInstallations.map((inst) =>
          appOctokit
            .request(
              'POST /app/installations/{installation_id}/access_tokens',
              { installation_id: inst.id },
            )
            .then((value) => ({
              ...value,
              data: { ...value.data, installation_id: inst.id },
            })),
        ),
      )

      // const {data: d} = await appOctokit.request('GET /installation/repositories');
      // const repos: components["schemas"]["repository"] = d.repositories
      const repositories = await Promise.all(
        accessTokens.map((accessToken) =>
          fetch('https://api.github.com/installation/repositories', {
            method: 'GET',
            body: null,
            headers: {
              Authorization: `token ${accessToken.data.token}`,
            },
          }).then((response) =>
            response.json().then((json) => ({
              ...octokitRepositorySchema.parse(json),
              auth_token: accessToken.data.token,
              installation_id: accessToken.data.installation_id,
            })),
          ),
        ),
      )

      return repositories.reduce<Repository[]>(
        (prev, curr) => [
          ...prev,
          ...curr.repositories.map((repo) => ({
            id: crypto.randomUUID(),
            name: repo.name,
            owner: repo.owner.login,
            branch: repo.default_branch,
            ref: repo.git_refs_url,
            oauthToken: curr.auth_token,
            installationId: curr.installation_id,
            cssFramework: 'other',
            tailwindPrefix: undefined,
            tailwindConfig: 'tailwind.config.ts',
            defaultUrl: '',
            registry: {},
          })),
        ],
        [],
      )
    }),
})

const octokitRepositorySchema = z.object({
  repositories: z.array(
    z.object({
      name: z.string(),
      owner: z.object({
        login: z.string(),
      }),
      default_branch: z.string(),
      git_refs_url: z.string(),
    }),
  ),
})

export async function createNewAccount({
  prisma,
  account,
  userId,
  teamId,
  email,
}: {
  prisma: Db
  account: AccountCreate
  userId: string
  teamId: string | undefined
  email: string
}) {
  const newAccount = await prisma.account.create({
    data: {
      firstName: account.firstName,
      lastName: account.lastName,
      role: account.role,
      userId,
      contact: email,
      team: {
        connectOrCreate: {
          where: {
            id: teamId || '',
          },
          create: {
            id: teamId,
          },
        },
      },
    },
    include: {
      team: {
        include: {
          repository: true,
        },
      },
    },
  })

  return {
    id: newAccount.id,
    firstName: newAccount.firstName,
    lastName: newAccount.lastName,
    role: newAccount.role,
    repository: getRepositoryFromTeam(newAccount.team),
    teamId: newAccount.team_id,
    contact: emailSchema.parse(newAccount.contact),
    seenWelcomeScreen: newAccount.seen_welcome_screen,
  } satisfies Account
}
