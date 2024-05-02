import path from 'node:path';
import express from 'express';
import {createExpressMiddleware} from '@trpc/server/adapters/express';
import {appRouter} from '@harmony/server/src/api/root';
import { createTRPCContextExpress } from '@harmony/server/src/api/trpc';
import { ClerkExpressWithAuth, LooseAuthProp } from "@clerk/clerk-sdk-node";
import cors from 'cors';
import { LOCALHOST } from '@harmony/util/src/utils/component';
import {prisma} from '@harmony/db/lib/prisma';
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
        if (value) {
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

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Define API routes
app.use(
  '/trpc',
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- ok
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
