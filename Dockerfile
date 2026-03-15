# Stage 1: Base
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.6 --activate

# Stage 2: Install dependencies
FROM base AS deps
WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM base AS builder
WORKDIR /app

# Copy all installed node_modules (including per-package ones pnpm creates)
COPY --from=deps /app ./
COPY . .

# Generate Prisma client
RUN cd apps/web && npx prisma generate

# Build only the web app
RUN pnpm turbo build --filter=web

# Stage 4: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static assets into the expected location within standalone
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
