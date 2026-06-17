FROM node:20-alpine

WORKDIR /app

# Build-time tools such as TypeScript and Vite are required for the frontend build.
# Do not use `npm config set production false`; newer npm versions reject that option.
ENV NODE_ENV=development
ENV NPM_CONFIG_INCLUDE=dev
ENV NPM_CONFIG_OMIT=

COPY package.json package-lock.json ./

RUN npm install --include=dev --no-audit --no-fund \
  && if [ ! -x ./node_modules/.bin/tsc ] || [ ! -x ./node_modules/.bin/vite ]; then \
    npm install --no-save --no-audit --no-fund \
      typescript@^5.7.3 \
      vite@^8.0.16 \
      @vitejs/plugin-react@^6.0.2 \
      tailwindcss@^3.4.17 \
      postcss@^8.4.49 \
      autoprefixer@^10.4.20 \
      @types/node@^22.10.7 \
      @types/react@^18.3.18 \
      @types/react-dom@^18.3.5; \
    fi \
  && test -x ./node_modules/.bin/tsc \
  && test -x ./node_modules/.bin/vite

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 4173

CMD ["sh", "-c", "npm run preview -- --host 0.0.0.0 --port ${PORT:-4173}"]
