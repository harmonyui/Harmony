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
import { getConfigFile } from './utils/get-config-file'

export interface CreateContextOptions {
  path: string
  repositoryId: string | undefined
  repository: Repository | undefined
  serverClient: CreateTRPCProxyClient<AppRouter>
}

export type CreateContext = CreateContextOptions

const createInnerTRPCContext = (opts: CreateContextOptions): CreateContext => {
  return {
    ...opts,
  }
}

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

// Global variable to store the current workspace path
let currentWorkspacePath: string = ''

export const setCurrentWorkspacePath = (path: string) => {
  currentWorkspacePath = path
}

export const createTRPCContextExpress = async ({
  req,
  path: localPath,
}: {
  res: CreateExpressContextOptions['res']
  req: Request
  path: string
}) => {
  // Use the current workspace path instead of headers
  if (!localPath) {
    throw new Error('No workspace path available')
  }

  // Get repository from config file
  const repository = getConfigFile(localPath)
  const repositoryId = repository?.id

  const environmentResult = environmentSchema.safeParse(
    req.headers['harmony-environment'],
  )
  const environment = environmentResult.success
    ? environmentResult.data
    : 'production'

  const token = req.headers['authorization']?.split(' ')[1]

  const serverClient = createClient({
    environment,
    getToken: async () => token ?? '',
    isLocal: true,
  })
  return createTRPCContext(localPath, repositoryId, repository, serverClient)
}

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

export const createTRPCRouter = t.router
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
