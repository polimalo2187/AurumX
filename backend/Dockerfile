# AurumX Backend - Railway Docker build
# Fix: avoid Railway/Alpine npm install crashes by using Debian-based Node 22.16.0.

FROM node:22.16.0-bookworm-slim AS build

WORKDIR /app

ENV NODE_ENV=development \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_PROGRESS=false \
    NPM_CONFIG_LOGLEVEL=warn

COPY package.json package-lock.json ./

# Install devDependencies because TypeScript is required for npm run build.
# Do not run npm config set production=false; newer npm rejects that option.
RUN node --version \
  && npm --version \
  && npm ci --include=dev --no-audit --no-fund --progress=false \
  && test -x ./node_modules/.bin/tsc

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:22.16.0-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/server.js"]
