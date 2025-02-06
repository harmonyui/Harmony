/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import type { Request } from 'express'
import type { Environment } from '@harmony/util/src/utils/component'
import {
  getEditorUrl,
  environmentSchema,
} from '@harmony/util/src/utils/component'
import type { CreateTRPCProxyClient } from '@trpc/client'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '@harmony/server/src/api/root'
import { Repository, repositorySchema } from '@harmony/util/src/types/branch'
import { jsonSchema } from '@harmony/util/src/updates/component'

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

export interface CreateContextOptions {
  path: string
  repositoryId: string | undefined
  repository: Repository | undefined
  serverClient: CreateTRPCProxyClient<AppRouter>
}

export type CreateContext = CreateContextOptions

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
const createInnerTRPCContext = (opts: CreateContextOptions): CreateContext => {
  return {
    ...opts,
  }
}

// export const createAuthContext = (session: Session) => {
//   return createInnerTRPCContext({
//     session
//   })
// }

const createTRPCContext = async (
  localPath: string,
  repositoryId: string | undefined,
  repository: Repository | undefined,
  serverClient: CreateTRPCProxyClient<AppRouter>,
) => {
  return createInnerTRPCContext({
    path: localPath,
    repositoryId,
    repository,
    serverClient,
  })
}

const isValidHeader = (header: unknown): header is string => {
  return typeof header === 'string'
}

export const createTRPCContextExpress = async ({
  req,
}: {
  res: CreateExpressContextOptions['res']
  req: Request
}) => {
  const localPath = req.headers['local-path']
  if (!localPath || typeof localPath !== 'string') {
    throw new Error('local-path header is required')
  }
  const repositoryIdHeader = req.headers['repository-id']
  const respositoryHeader = req.headers['repository']
  if (!isValidHeader(respositoryHeader) && !isValidHeader(repositoryIdHeader)) {
    throw new Error('repository-id or repository header is required')
  }
  const repositoryParseResult = isValidHeader(respositoryHeader)
    ? jsonSchema.pipe(repositorySchema).safeParse(atob(respositoryHeader))
    : undefined
  const repository = repositoryParseResult?.success
    ? repositoryParseResult.data
    : undefined
  const repositoryId = isValidHeader(repositoryIdHeader)
    ? repositoryIdHeader
    : undefined

  const environmentResult = environmentSchema.safeParse(
    req.headers['harmony-environment'],
  )
  const environment = environmentResult.success
    ? environmentResult.data
    : 'production'

  const serverClient = createClient({
    environment,
    getToken: async () => '',
    isLocal: true,
  })
  return createTRPCContext(localPath, repositoryId, repository, serverClient)
}

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC.context<typeof createTRPCContextExpress>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure

const getBaseUrl = (environment: Environment): string => {
  return getEditorUrl(environment)
}

export const createClient = ({
  environment,
  getToken,
  isLocal,
}: {
  environment: Environment
  getToken: () => Promise<string>
  isLocal: boolean
}): CreateTRPCProxyClient<AppRouter> => {
  return createTRPCProxyClient<AppRouter>({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${getBaseUrl(environment)}/trpc`,
        // You can pass any HTTP headers you wish here
        fetch(url, options) {
          return new Promise<Response>((resolve, reject) => {
            getToken()
              .then((token) => {
                resolve(
                  fetch(url, {
                    ...options,
                    credentials: 'include',
                    headers: {
                      ...options?.headers,
                      ...(token
                        ? {
                            Authorization: `Bearer ${token}`,
                          }
                        : {}),
                      ...(isLocal
                        ? { 'harmony-environment': environment }
                        : {}),
                    },
                  }),
                )
              })
              .catch(reject)
          })
        },
      }),
    ],
  })
}
