FROM node:20-alpine AS build

WORKDIR /app

# Railway's builder was using npm 10.8.2, which can crash with:
# "Exit handler never called!" during dependency installation.
# Pin npm to a stable version before installing project dependencies.
ENV NODE_ENV=development
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_OMIT=

RUN npm install -g npm@10.9.2

COPY package.json package-lock.json ./

RUN npm ci --include=dev --no-audit --no-fund \
  && test -x ./node_modules/.bin/tsc

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

RUN npm prune --omit=dev --no-audit --no-fund

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 8080

CMD ["npm", "start"]
