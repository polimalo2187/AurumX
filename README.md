# AurumX Backend

Backend para AurumX Mining.

## Stack

- Node.js
- Express
- TypeScript
- MongoDB / Mongoose
- BSC / BEP20
- USDT
- JWT
- Cron interno para depósitos y recompensas

## Scripts

```bash
npm install
npm run dev
npm run build
npm start
npm run seed:machines
```

## Health check

```txt
GET /api/health
```

## Seed de máquinas

El seed crea los planes oficiales:

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

## Endpoints actuales

### Auth dev

```txt
GET  /api/auth/status
POST /api/auth/dev/telegram-verify
POST /api/auth/dev/issue-token
```

Los endpoints `dev` no deben usarse como autenticación final de producción; existen para probar mientras se integra Telegram real.

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

### Depósitos automáticos

```txt
POST /api/deposits/orders
POST /api/deposits/orders/:id/submit-hash
GET  /api/deposits/my
```

### Recompensas

```txt
POST /api/rewards/run
```

También existe cron interno para procesar recompensas cada minuto.

### Retiros

```txt
POST /api/withdrawals
GET  /api/withdrawals/my
```

### Admin / retiros

```txt
GET  /api/admin/withdrawals/pending
POST /api/admin/withdrawals/:id/approve
POST /api/admin/withdrawals/:id/reject
```

## Reglas implementadas de retiros

- Mínimo de retiro: 1 USDT.
- Red: BSC / BEP20.
- Solo 1 retiro pendiente por usuario.
- Solo 1 solicitud cada 24 horas.
- Al solicitar retiro, el saldo pasa de `availableUSDT` a `lockedUSDT`.
- Al aprobar retiro, el admin debe registrar el hash BEP20.
- Al rechazar retiro, el saldo bloqueado vuelve a disponible.

## v0.7.0 - Referidos y potencia

Incluye el sistema de referidos válidos de AurumX:

- Un referido solo cuenta cuando activa su primera máquina pagada confirmada.
- Cada referido válido aporta +2.5% de potencia.
- La potencia máxima es +30% con 12 referidos válidos.
- La potencia solo aplica a máquinas pagadas; Pico Inicial y Aurora no reciben potencia.
- Después de 12 referidos, cada bloque adicional de 10 referidos excedentes permite reclamar una máquina Aurora.

Endpoints agregados:

```txt
GET  /api/referrals/me
GET  /api/referrals/rewards/status
POST /api/referrals/rewards/claim-machine
```
