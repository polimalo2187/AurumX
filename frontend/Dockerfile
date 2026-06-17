FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev --no-audit --no-fund

COPY . .
RUN npm run build

ENV HOST=0.0.0.0
EXPOSE 4173

CMD ["sh", "-c", "npm run preview -- --host 0.0.0.0 --port ${PORT:-4173}"]
