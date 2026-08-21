# Fancheer Backend — production image
FROM node:20-bookworm-slim AS base
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY src ./src
RUN pnpm prisma:gen && pnpm build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml prisma.config.ts ./
COPY prisma ./prisma
COPY seed.ts seed-uploads.ts seed-upload-manifest.ts graph-seed-data.ts ./
COPY seed-assets ./seed-assets
COPY scripts ./scripts
COPY src/lib ./src/lib
COPY docker ./docker
COPY --from=build /app/dist ./dist
COPY --from=build /app/generated ./generated
COPY docker/entrypoint.sh /entrypoint.sh

RUN pnpm install --frozen-lockfile \
  && chmod +x /entrypoint.sh \
  && mkdir -p uploads

VOLUME ["/app/uploads"]
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
