FROM node:18-alpine AS base
 
FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app
RUN corepack enable
ENV OPENAI_API_KEY=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
ENV GITHUB_APP_ID=794320
ENV GITHUB_APP_CLIENT_ID=Iv1.cea4bda0db4286a5
ENV GITHUB_APP_CLIENT_SECRET=b5cbfd1703bcfc300286c092cab3d9ac6e859ea1
ENV GITHUB_API_KEY=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
ENV GITHUB_CLIENT_ID=cd59ad4b32a8146af103
ENV GITHUB_CLIENT_SECRET=f87ce6a1df4f15fd263932a036058a71d2a78467
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bmV1dHJhbC1taW5rLTM4LmNsZXJrLmFjY291bnRzLmRldiQ
ENV CLERK_PUBLISHABLE_KEY=pk_test_bmV1dHJhbC1taW5rLTM4LmNsZXJrLmFjY291bnRzLmRldiQ
ENV CLERK_SECRET_KEY=sk_test_ujDzfEmWKOT3qowRkvFmtV5EapjMuXFbG5bC7sH2fz
ENV DATABASE_URL=postgres://default:OmNJZxVd30eS@ep-orange-meadow-a6w5vdlq-pooler.us-west-2.aws.neon.tech:5432/verceldb?sslmode=require&pgbouncer=true&connect_timeout=15
ENV PRIVATE_KEY=/Users/braydonjones/Downloads/harmony-ai-app.2024-01-11.private-key.pem
ENV SMTP_EMAIL=bradofrado@gmail.com
ENV SMTP_KEY=uazkrgfcxhdfmlro
ENV ENV=production

#RUN pnpm add --global turbo
COPY . .
#RUN turbo prune harmony-ai-editor --docker
 
# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
RUN corepack enable
WORKDIR /app
 
# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/editor/package.json ./packages/editor/package.json
COPY . .

RUN pnpm install
 
# Build the project
RUN pnpm run build --filter=harmony-ai-editor
 
# FROM base AS runner
# WORKDIR /app
 
# COPY --from=installer /app/packages/editor/dist/server.js .
 
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
# COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
EXPOSE 4200
CMD npx dotenv -e .env -- node packages/editor/dist/server.js