import { appRouter } from '../../../../src/server/api/root';
import { createTRPCContext } from '../../../../src/server/api/trpc';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

const handler = (request: Request) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => createTRPCContext(),
  });
}

export const GET = handler;
export const POST = handler;