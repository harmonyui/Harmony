import path from 'node:path';
import express from 'express';
import {createExpressMiddleware} from '@trpc/server/adapters/express';
import {appRouter} from '@harmony/server/src/api/root';
import { createTRPCContextExpress } from '@harmony/server/src/api/trpc';
import { ClerkExpressWithAuth, LooseAuthProp } from "@clerk/clerk-sdk-node";
import cors from 'cors';
import { LOCALHOST } from '@harmony/util/src/utils/component';

const app = express();
const PORT = process.env.EDITOR_PORT || 4200;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- ok
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface -- ok
    interface Request extends LooseAuthProp {}
  }
}

app.use(
  cors({
    origin: [`http://${LOCALHOST}:3000`],
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
