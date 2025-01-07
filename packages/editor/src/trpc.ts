import type { CreateTRPCProxyClient } from '@trpc/client'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '@harmony/server/src/api/root'
import superjson from 'superjson'
import type { Environment } from '@harmony/util/src/utils/component'
import { getEditorUrl } from '@harmony/util/src/utils/component'

export const PORT = 4200

const getBaseUrl = (environment: Environment | 'CLI'): string => {
  if (environment === 'CLI') {
    return 'http://localhost:4300'
  }

  return getEditorUrl(environment)
}

export const createClient = ({
  environment,
  getToken,
  isLocal,
  repositoryId,
}: {
  environment: Environment
  getToken: () => Promise<string>
  isLocal: boolean
  repositoryId: string
}): CreateTRPCProxyClient<AppRouter> => {
  return createTRPCProxyClient<AppRouter>({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${getBaseUrl(isLocal ? 'CLI' : environment)}/trpc`,
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
                      'repository-id': repositoryId,
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
