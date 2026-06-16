# AurumX Backend

Backend base para AurumX Mining.

## Stack

- Node.js
- Express
- TypeScript
- MongoDB + Mongoose
- JWT
- ethers.js preparado para BSC/BEP20

## Scripts

```bash
npm install
npm run dev
npm run build
npm run seed:machines
```

## Health check

```txt
GET /api/health
```

## Seed de máquinas

```bash
npm run seed:machines
```

Crea o actualiza los planes oficiales:

- Pico Inicial
- Excavadora
- Perforadora
- Trituradora
- Planta Élite
- Dragalina
- Coloso
- Aurora

## Endpoints incluidos en esta versión

```txt
GET  /api/health
GET  /api/auth/status
POST /api/auth/dev/telegram-verify   # Solo desarrollo
POST /api/auth/dev/issue-token       # Solo desarrollo
GET  /api/users/me
GET  /api/users/me/dashboard
GET  /api/wallet/me
GET  /api/wallet/transactions
```

## Nota importante

Los endpoints `/api/auth/dev/*` están bloqueados automáticamente en producción. Sirven solo para probar el backend antes de integrar el bot real de Telegram.
