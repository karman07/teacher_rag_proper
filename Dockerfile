FROM node:20-alpine AS builder
WORKDIR /app

# Declare build-time env vars for NEXT_PUBLIC_* (Next.js bakes these in at build time)
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
# Build the Next.js app (NEXT_PUBLIC vars are embedded at this point)
RUN npm run build

# ─── Production image ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3001
ENV PORT=3001
CMD ["node", "server.js"]
