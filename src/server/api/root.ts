import { branchRoute } from "./routers/branch";
import { pullRequestRouter } from "./routers/pull-request";
import { setupRoute } from "./routers/setup";
import { createTRPCRouter } from "./trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  setup: setupRoute,
	branch: branchRoute,
  pullRequest: pullRequestRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
