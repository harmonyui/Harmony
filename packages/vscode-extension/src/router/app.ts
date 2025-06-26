import { createTRPCRouter } from '../trpc'
import { editorRouter } from './editor'

export const appRouter = createTRPCRouter({
  editor: editorRouter,
})

export type AppRouter = typeof appRouter
