# BUSL-1.1 · Copyright (c) 2026 SilverVine Labs
# Tier-0 isolated verification — zero host Node/pnpm required
#   docker build -t slivervine-citadel .
#   docker run --rm slivervine-citadel
# Full bar override:
#   docker run --rm slivervine-citadel pnpm test

FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

CMD ["sh", "-c", "echo '[tier0] demo:e2e start' && pnpm run demo:e2e && echo '[tier0] demo:e2e PASS'"]
