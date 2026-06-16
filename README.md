# AurumX Backend

Backend base de AurumX Mining construido con Node.js, Express, TypeScript, MongoDB/Mongoose y verificación automática de depósitos USDT BEP20 en BSC.

## Estado actual

Versión: `v0.5.0`

Incluye:

- Configuración base Express + TypeScript.
- Conexión MongoDB.
- Validación de variables de entorno.
- Health check.
- Seed oficial de máquinas AurumX.
- Modelos de usuario, wallet, transacciones, máquinas, órdenes de depósito y logs de recompensas.
- Autenticación JWT base con endpoints dev.
- Endpoints de usuario, wallet y máquinas.
- Claim de máquina gratis `Pico Inicial`.
- Depósitos automáticos por hash en BSC/BEP20.
- Verificación de transferencia oficial USDT BEP20.
- Activación automática de máquinas pagadas tras depósito confirmado.
- Cron de reintento para depósitos pendientes de confirmaciones.
- RewardService para pago de recompensas por ciclo individual de 24 horas.
- Cron de recompensas cada 1 minuto.
- Acreditación automática a wallet interna.
- MachineRewardLog idempotente por ciclo.
- Cierre automático de máquinas al llegar al 200% del payout máximo.

## Máquinas oficiales

| Tipo | Precio | Nombre | Payout máximo | Producción base / 24h |
|---|---:|---|---:|---:|
| FREE | 0 USDT | Pico Inicial | 2 USDT | 0.10 USDT |
| PAID | 7 USDT | Excavadora | 14 USDT | 0.70 USDT |
| PAID | 24 USDT | Perforadora | 48 USDT | 2.40 USDT |
| PAID | 50 USDT | Trituradora | 100 USDT | 5.00 USDT |
| PAID | 100 USDT | Planta Élite | 200 USDT | 10.00 USDT |
| PAID | 500 USDT | Dragalina | 1000 USDT | 50.00 USDT |
| PAID | 1000 USDT | Coloso | 2000 USDT | 100.00 USDT |
| REWARD | 0 USDT | Aurora | 14 USDT | 0.70 USDT |

## Requisitos

- Node.js 20+
- MongoDB
- RPC de BSC
- Dirección oficial del contrato USDT BEP20
- Wallet de depósito BSC de la plataforma

## Variables de entorno

Copia `.env.example` a `.env` y configura:

```env
MONGODB_URI=
JWT_SECRET=
BSC_RPC_URL=
BSC_USDT_CONTRACT_ADDRESS=
PLATFORM_BSC_DEPOSIT_ADDRESS=
```

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

## Endpoints principales actuales

### Auth dev

```txt
GET  /api/auth/status
POST /api/auth/dev/telegram-verify
POST /api/auth/dev/issue-token
```

Los endpoints dev se bloquean en producción.

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

Este endpoint requiere usuario admin. El cron interno se ejecuta automáticamente cada minuto cuando el backend está corriendo.

## Flujo de depósito automático

1. Usuario crea orden de depósito para una máquina pagada.
2. Backend entrega wallet BSC/BEP20 de la plataforma.
3. Usuario deposita USDT BEP20.
4. Usuario pega hash/txid.
5. Backend verifica en BSC:
   - hash válido,
   - transacción exitosa,
   - contrato USDT oficial,
   - receptor correcto,
   - monto suficiente,
   - confirmaciones mínimas.
6. Si es válido, la máquina pagada se activa automáticamente.
7. Si faltan confirmaciones, queda pendiente y el cron reintenta.

## Flujo de recompensas

1. Cada máquina activa tiene su propio `nextRewardAt`.
2. El cron revisa cada minuto las máquinas vencidas.
3. Si pasaron 24 horas desde el último ciclo, calcula la recompensa.
4. La potencia solo aplica a máquinas pagadas.
5. La recompensa nunca supera el payout restante.
6. Se crea `MachineRewardLog` con índice único por máquina/ciclo.
7. Se acredita wallet mediante `WalletTransaction`.
8. Si llega al 200%, la máquina queda `COMPLETED`.

## Próximo bloque recomendado

- Retiros manuales
- `WithdrawalRequest.model.ts`
- `WithdrawalService`
- Solicitud de retiro cada 24 horas
- Admin aprueba/rechaza retiro con hash BEP20
