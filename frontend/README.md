# AurumX Frontend

Frontend oficial de **AurumX Mining**.

## Stack

- React
- Vite
- TypeScript
- React Router
- TanStack Query
- Framer Motion
- TailwindCSS

## Estructura

La carpeta raíz del proyecto es obligatoriamente:

```txt
frontend/
```

## Variables de entorno

Copia `.env.example` a `.env`:

```env
VITE_API_BASE_URL=https://your-aurumx-backend.up.railway.app/api
VITE_APP_NAME=AurumX
VITE_TELEGRAM_BOT_USERNAME=your_bot_username_without_at
```

No pongas secretos en el frontend. El token real del bot, JWT secret y RPC privado pertenecen al backend.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Entrega v0.1.0

Incluye base visual, rutas, layouts, cliente API, auth provider, páginas principales y estructura preparada para conectar con el backend AurumX.


## Railway deploy fix

This frontend includes `railpack.json`, `.npmrc`, `.nvmrc`, and `.node-version` to force Node 20 and install dev dependencies during the Railway/Railpack build. Root Directory must be `frontend`.

Recommended Railway settings:

```txt
Root Directory: frontend
Build Command: leave empty or use npm run build only if Railway asks
Start Command: leave empty so Railpack serves the Vite static build with Caddy
```

Required variables:

```env
VITE_API_BASE_URL=https://your-backend.up.railway.app/api
VITE_APP_NAME=AurumX
VITE_TELEGRAM_BOT_USERNAME=your_bot_username_without_at
```


## Runtime environment on Railway

The Docker image generates `dist/env.js` at container startup from Railway runtime variables. This is required because Vite variables are normally embedded at build time. Keep these variables configured in the frontend Railway service:

```env
VITE_API_BASE_URL=https://aurumx-production.up.railway.app/api
VITE_APP_NAME=AurumX
VITE_TELEGRAM_BOT_USERNAME=AurumX1bot
```
