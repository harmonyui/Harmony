/* eslint-disable @typescript-eslint/no-misused-promises -- ok*/
import path from 'node:path'
import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from '@harmony/server/src/api/root'
import { createTRPCContextExpress } from '@harmony/server/src/api/trpc'
import type { LooseAuthProp } from '@clerk/clerk-sdk-node'
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'
import cors from 'cors'
import { prisma } from '@harmony/db/lib/prisma'
import morgan from 'morgan'
import { PORT } from './trpc'

const app = express()

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- ok
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface -- ok
    interface Request extends LooseAuthProp {}
  }
}

app.use(
  cors({
    origin(origin, callback) {
      prisma.repository
        .findFirst({
          where: {
            default_url: origin || '',
          },
        })
        .then((value) => {
          if (value || origin === 'https://formbricks-web-psi.vercel.app') {
            callback(null, origin)
          } else {
            callback(null, [])
          }
        })
        .catch((err) => {
          callback(new Error(String(err)))
        })
    },
    credentials: true,
  }),
)
if (process.env.NODE_ENV !== 'production') {
  void (async () => {
    const webpack = await import('webpack')
    const middleware = await import('webpack-dev-middleware')
    const hotMiddleware = await import('webpack-hot-middleware')
    const webpackDev = await import('../webpack.config.dev')

    const compiler = webpack.default(webpackDev.default)
    app.use(
      middleware.default(compiler, {
        stats: { colors: true },
      }),
    )
    app.use(
      hotMiddleware.default(compiler, {
        path: '/__webpack_hmr',
      }),
    )
  })()
}

app.use(morgan('short'))

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')))

// Define API routes
app.use(
  '/trpc',

  ClerkExpressWithAuth({}),
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContextExpress,
    onError({ error }) {
      console.error(error)
    },
  }),
)

// Start the server
app.listen(4200, () => {
  console.log(`Server is running on port ${PORT}`)
})
