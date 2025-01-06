import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './router/app'
import { createTRPCContextExpress } from './trpc'
import { logger } from './utils/logger'
import cors from 'cors'

export const createServer = ({
  port,
  path,
}: {
  port: number
  path: string
}) => {
  const app = express()

  app.use(
    cors({
      origin(origin, callback) {
        callback(null, origin)
      },
      credentials: true,
    }),
  )

  app.use((req, _, next) => {
    req.headers['local-path'] = path

    next()
  })

  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: createTRPCContextExpress,
      onError({ error }) {
        console.error(error)
      },
    }),
  )

  // Start the server
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`)
  })
}
