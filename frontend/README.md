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
