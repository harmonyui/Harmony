import { createTRPCRouter } from '../trpc'
import { editorRouter } from './editor'

export const appRouter = createTRPCRouter({
  editor: editorRouter,
})
