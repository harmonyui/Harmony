import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@harmony/server/src/api/root';
import superjson from 'superjson';
import { LOCALHOST } from '@harmony/util/src/utils/component';

export const PORT = process.env.EDITOR_PORT || 4200;

const getBaseUrl = (): string => {
  if (process.env.ENV === 'production') return `${process.env.EDITOR_URL}`; // SSR should use vercel url
  return `http://${LOCALHOST}:${PORT}`; // dev SSR should use localhost
};

export const client = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
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