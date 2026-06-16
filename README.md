# AurumX Backend

Backend base para **AurumX Mining**, plataforma de máquinas de minería industrial de oro.

## Stack

- Node.js
- Express
- TypeScript
- MongoDB + Mongoose
- JWT
- Preparado para Telegram Auth y verificación BSC/BEP20

## Comandos

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

## Endpoints actuales

### Auth desarrollo

```txt
GET  /api/auth/status
POST /api/auth/dev/telegram-verify
POST /api/auth/dev/issue-token
```

Los endpoints `/api/auth/dev/*` solo funcionan fuera de producción. Sirven para probar flujos antes de integrar el bot real de Telegram.

### Usuario

```txt
GET /api/users/me
GET /api/users/me/dashboard
```

### Wallet

```txt
GET /api/wallet/me
GET /api/wallet/transactions
```

### Máquinas

```txt
GET  /api/machines/plans
GET  /api/machines/my
POST /api/machines/free/claim
```

## Máquinas oficiales

```txt
FREE       0 USDT      Pico Inicial
PAID       7 USDT      Excavadora
PAID       24 USDT     Perforadora
PAID       50 USDT     Trituradora
PAID       100 USDT    Planta Élite
PAID       500 USDT    Dragalina
PAID       1000 USDT   Coloso
REWARD     0 USDT      Aurora
```

## Reglas económicas centrales

```txt
Máquinas pagadas:
- payout máximo = 200% del monto activado
- ciclo de producción cada 24 horas
- duración base = 20 ciclos
- potencia por referidos solo acelera máquinas pagadas
- potencia no aumenta payout máximo

Pico Inicial:
- 1 vez por usuario verificado
- principal virtual = 1 USDT
- payout máximo = 2 USDT
- producción base = 0.10 USDT cada 24h
- no recibe potencia

Aurora:
- máquina premio por referidos excedentes
- principal virtual = 7 USDT
- payout máximo = 14 USDT
- producción base = 0.70 USDT cada 24h
- no recibe potencia
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar valores reales.

```txt
MONGODB_URI
JWT_SECRET
BSC_RPC_URL
BSC_USDT_CONTRACT_ADDRESS
PLATFORM_BSC_DEPOSIT_ADDRESS
```

## Estado de esta versión

Versión v0.3.0:

- Modelos base de máquinas de usuario.
- Modelo de reclamo de Pico Inicial.
- Modelo de órdenes de depósito preparado para verificación automática BSC/BEP20.
- Modelo de logs de recompensa preparado para idempotencia por ciclo.
- Endpoints para listar planes, listar mis máquinas y reclamar Pico Inicial.
- Dashboard de usuario ahora incluye resumen de máquinas.
