FROM node:20-alpine

WORKDIR /app

# Railway can inject production npm settings during Docker builds.
# Vite/TypeScript/Tailwind are required at build time, so force dev dependencies here.
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false
ENV NPM_CONFIG_OMIT=

COPY package.json package-lock.json ./

RUN npm config set production false \
  && npm install --include=dev --no-audit --no-fund \
  && test -x ./node_modules/.bin/tsc \
  && test -x ./node_modules/.bin/vite

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 4173

CMD ["sh", "-c", "npm run preview -- --host 0.0.0.0 --port ${PORT:-4173}"]
