FROM node:22.16.0-bookworm-slim AS build

WORKDIR /app

ENV CI=true
ENV NODE_ENV=development
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json package-lock.json ./
COPY .npmrc ./

RUN node --version \
  && pnpm --version \
  && pnpm install --prod=false --no-frozen-lockfile --ignore-scripts

COPY tsconfig.json ./
COPY src ./src

RUN test -x ./node_modules/.bin/tsc \
  && pnpm run build

RUN pnpm prune --prod --ignore-scripts

FROM node:22.16.0-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/server.js"]
