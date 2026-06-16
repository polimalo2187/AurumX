# AurumX Backend

Backend de AurumX Mining construido con Node.js, Express, TypeScript, MongoDB/Mongoose y verificación automática de depósitos USDT BEP20 en BSC.

## Estado actual

Versión: `0.8.0`

Incluye:

- Express + TypeScript.
- MongoDB + Mongoose.
- Seed oficial de máquinas AurumX.
- Usuarios, wallet interna y transacciones.
- JWT base y endpoints dev para pruebas.
- Máquinas: Pico Inicial, máquinas pagadas y Aurora.
- Depósitos automáticos BSC/BEP20 mediante hash.
- Activación automática de máquina pagada al validar depósito.
- Recompensas cada 24 horas por máquina.
- Cierre automático de máquinas al llegar al payout máximo.
- Retiros manuales por administrador.
- Referidos válidos, potencia +2.5% hasta +30% y Aurora por excedentes.
- Auditoría administrativa.
- Admin avanzado: dashboard, usuarios, depósitos, retiros y logs.

## Reglas económicas principales

- Moneda: USDT.
- Red: BSC / BEP20.
- Máquinas pagadas: payout máximo 200% del monto activado.
- Capital inicial: no se devuelve como operación separada; queda incluido dentro del ciclo de producción.
- Ciclo de producción: cada 24 horas desde la activación individual de cada máquina.
- Potencia por referido válido: +2.5%.
- Potencia máxima: +30%.
- Referido válido: usuario referido que activa su primera máquina pagada con depósito confirmado.
- Pico Inicial y Aurora no reciben potencia.
- Retiro mínimo: 1 USDT.
- Solo 1 retiro pendiente por usuario.
- Solo 1 solicitud de retiro cada 24 horas.

## Máquinas oficiales

| Tipo | Nombre | Precio | Payout máximo | Producción base / 24h |
|---|---:|---:|---:|---:|
| FREE | Pico Inicial | 0 USDT | 2 USDT | 0.10 USDT |
| PAID | Excavadora | 7 USDT | 14 USDT | 0.70 USDT |
| PAID | Perforadora | 24 USDT | 48 USDT | 2.40 USDT |
| PAID | Trituradora | 50 USDT | 100 USDT | 5.00 USDT |
| PAID | Planta Élite | 100 USDT | 200 USDT | 10.00 USDT |
| PAID | Dragalina | 500 USDT | 1000 USDT | 50.00 USDT |
| PAID | Coloso | 1000 USDT | 2000 USDT | 100.00 USDT |
| REWARD | Aurora | 0 USDT | 14 USDT | 0.70 USDT |

## Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Seed de máquinas

```bash
npm run seed:machines
```

## Health check

```txt
GET /api/health
```

## Endpoints principales

### Auth / usuarios

```txt
GET  /api/auth/status
POST /api/auth/dev/telegram-verify
POST /api/auth/dev/issue-token
GET  /api/users/me
GET  /api/users/me/dashboard
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

### Depósitos

```txt
POST /api/deposits/orders
POST /api/deposits/orders/:id/submit-hash
GET  /api/deposits/my
```

### Recompensas

```txt
POST /api/rewards/run
```

### Retiros

```txt
POST /api/withdrawals
GET  /api/withdrawals/my
```

### Referidos

```txt
GET  /api/referrals/me
GET  /api/referrals/rewards/status
POST /api/referrals/rewards/claim-machine
```

### Admin

```txt
GET  /api/admin/dashboard
GET  /api/admin/users
GET  /api/admin/users/:id
POST /api/admin/users/:id/block
POST /api/admin/users/:id/unblock

GET  /api/admin/deposits
GET  /api/admin/deposits/:id
POST /api/admin/deposits/:id/retry-verification
POST /api/admin/deposits/:id/reject

GET  /api/admin/withdrawals/pending
POST /api/admin/withdrawals/:id/approve
POST /api/admin/withdrawals/:id/reject

GET  /api/admin/audit-logs
```

## Variables de entorno críticas

```env
MONGODB_URI=
JWT_SECRET=
BSC_RPC_URL=
BSC_USDT_CONTRACT_ADDRESS=
PLATFORM_BSC_DEPOSIT_ADDRESS=
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
ADMIN_TELEGRAM_IDS=
```

## Próximas fases recomendadas

- v0.9.0: Telegram real + notificaciones.
- v0.10.0: rate limit, hardening de validaciones y seguridad de producción.
- v0.11.0: RiskService antifraude básico.
- v0.12.0: tests mínimos y colección Postman/OpenAPI.
