# ── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are embedded into the JS bundle at build time.
# They must point to where the *browser* reaches the backend — i.e. the
# host-mapped ports (localhost), not Docker service names.
ARG NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
ARG NEXT_PUBLIC_ML_URL=http://localhost:8000
ENV NEXT_PUBLIC_GATEWAY_URL=$NEXT_PUBLIC_GATEWAY_URL
ENV NEXT_PUBLIC_ML_URL=$NEXT_PUBLIC_ML_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Production runtime ─────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Only copy what next start needs
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
# next.config.ts is read at startup by the Next.js server
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000
CMD ["npm", "start"]
