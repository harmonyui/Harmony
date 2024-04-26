import { appRouter } from '@harmony/server/src/api/root';
import { createTRPCContext } from '@harmony/server/src/api/trpc';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

const handler = (request: Request) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: ({req, resHeaders}) => createTRPCContext(req),
  });
}

export const GET = handler;
export const POST = handler;