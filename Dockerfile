# ── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Copy lock files and package manifests
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# ── Stage 2: Build the Next.js application ───────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copy installed dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma: generate client before building
RUN npx prisma generate

# Build Next.js standalone bundle
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Minimal production runtime image ────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static    ./.next/static
COPY --from=builder /app/public          ./public
COPY --from=builder /app/prisma          ./prisma
COPY --from=builder /app/db              ./db
COPY --from=builder /app/entrypoint.sh   ./entrypoint.sh

# Ensure db directory and entrypoint are owned and writable by nextjs user
RUN mkdir -p /app/db && \
    chmod +x /app/entrypoint.sh && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000 8080
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/entrypoint.sh"]
