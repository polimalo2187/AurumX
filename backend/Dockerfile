FROM node:20-alpine

WORKDIR /app

# Build TypeScript with devDependencies available.
# Railway/Railpack can set production mode during build; this Dockerfile avoids that.
ENV NODE_ENV=development
ENV NPM_CONFIG_OMIT=

COPY package.json package-lock.json ./

RUN npm install --include=dev --no-audit --no-fund \
  && test -x ./node_modules/.bin/tsc

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Keep runtime smaller and production-focused after the build is complete.
RUN npm prune --omit=dev --no-audit --no-fund

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 8080

CMD ["npm", "start"]
