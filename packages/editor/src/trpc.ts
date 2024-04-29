import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@harmony/server/src/api/root';
import superjson from 'superjson';

export const client = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: 'http://localhost:4200/trpc',
      // You can pass any HTTP headers you wish here
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        });
      },
    }),
  ],
});