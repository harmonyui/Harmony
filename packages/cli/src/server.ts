import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './router/app'
import { createTRPCContextExpress } from './trpc'
import { logger } from './utils/logger'
import cors from 'cors'
import { getConfigFile } from './utils/get-config-file'

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

    const repository = getConfigFile(path)
    if (repository) {
      req.headers['repository'] = btoa(JSON.stringify(repository))
    }

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
