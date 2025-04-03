FROM node:current-alpine3.18 AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app
RUN npm install -g turbo@latest
COPY . .
RUN turbo prune --scope=harmony-ai-editor --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm add -g corepack@latest
RUN corepack enable
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
ARG database_url
ARG env
ENV DATABASE_URL=${database_url}
ENV ENV=${env}
RUN pnpm run build --filter=harmony-ai-editor

FROM base AS runner
WORKDIR /app

COPY --from=installer /app/packages/editor/dist-server ./dist
COPY --from=installer /app/packages/editor/public ./public
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages/db/lib/generated/client ./generated/client

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
EXPOSE 4200
CMD node dist/server.js