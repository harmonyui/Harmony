/* eslint-disable @typescript-eslint/no-misused-promises -- ok*/
import path from 'node:path';
import express from 'express';
import {createExpressMiddleware} from '@trpc/server/adapters/express';
import {appRouter} from '@harmony/server/src/api/root';
import { createTRPCContextExpress } from '@harmony/server/src/api/trpc';
import type { LooseAuthProp } from "@clerk/clerk-sdk-node";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import cors from 'cors';
import {prisma} from '@harmony/db/lib/prisma';
import webpack from 'webpack';
import middleware from 'webpack-dev-middleware';
import hotMiddleware from 'webpack-hot-middleware';
import morgan from 'morgan';
import webpackDev from '../webpack.config.dev';
import { PORT } from './trpc';

const app = express();

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
      prisma.repository.findFirst({
        where: {
          default_url: origin || ''
        }
      }).then((value) => {
        if (value || origin === 'https://formbricks-web-psi.vercel.app') {
          callback(null, origin)
        } else {
          callback(null, []);
        }
      }).catch(err => {
        callback(new Error(String(err)));
      });
      
    },
    credentials: true,
  })
);
if (process.env.NODE_ENV === 'development') {
  const compiler = webpack(webpackDev)
  app.use(middleware(compiler, {
    stats: { colors: true },
  }))
  app.use(hotMiddleware(compiler, {
    path: '/__webpack_hmr',
  }));
}

app.use(morgan('short'))


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Define API routes
app.use(
  '/trpc',
   
  ClerkExpressWithAuth({
  }),
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContextExpress
  }),
);

// Start the server
app.listen(4200, () => {
  console.log(`Server is running on port ${PORT}`);
});
