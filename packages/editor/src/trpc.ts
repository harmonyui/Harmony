import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '@harmony/server/src/api/root'
import superjson from 'superjson'
import type { Environment } from '@harmony/util/src/utils/component'
import { getEditorUrl } from '@harmony/util/src/utils/component'

export const PORT = 4200

const getBaseUrl = (environment: Environment): string => {
  return getEditorUrl(environment)
}

export const createClient = (
  environment: Environment,
  token?: string | null,
) => {
  return createTRPCProxyClient<AppRouter>({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${getBaseUrl(environment)}/trpc`,
        // You can pass any HTTP headers you wish here
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
              ...options?.headers,
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
          })
        },
      }),
    ],
  })
}
