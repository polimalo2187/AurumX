FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=development
ENV CI=true
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json package-lock.json ./

RUN node --version \
  && pnpm --version \
  && pnpm install --prod=false --no-frozen-lockfile \
  && test -x ./node_modules/.bin/tsc \
  && test -x ./node_modules/.bin/vite

COPY . .

RUN pnpm run build \
  && chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 8080

CMD ["/app/docker-entrypoint.sh"]
