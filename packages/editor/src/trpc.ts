import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@harmony/server/src/api/root';
import superjson from 'superjson';
import { LOCALHOST } from '@harmony/util/src/utils/component';

export const client = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `http://${LOCALHOST}:4200/trpc`,
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