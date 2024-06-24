'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { api } from './api'

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

export const TrpcProvider: React.FC<{ children: React.ReactNode }> = (p) => {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    api.createClient({
      // config() {
      // 	return {
      /**
       * Transformer used for data de-serialization from the server.
       *
       * @see https://trpc.io/docs/data-transformers
       */
      transformer: superjson,

      /**
       * Links used to determine request flow from client to server.
       *
       * @see https://trpc.io/docs/links
       */
      links: [
        // loggerLink({
        // 	enabled: (opts) =>
        // 		process.env.NODE_ENV === "development" ||
        // 		(opts.direction === "down" && opts.result instanceof Error),
        // }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
      // 		};
      // 	},
      // 	/**
      // 	 * Whether tRPC should await queries when server rendering pages.
      // 	 *
      // 	 * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
      // 	 */
      // 	ssr: false,
      // })
    }),
  )

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {p.children}
      </QueryClientProvider>
    </api.Provider>
  )
}
