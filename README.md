# AurumX Backend

Backend de AurumX Mining construido con Node.js, Express, TypeScript, MongoDB/Mongoose y verificación de depósitos USDT BEP20 en BSC.

## Versión

`0.9.0`

## Incluye hasta esta versión

- Base Express + TypeScript.
- MongoDB/Mongoose.
- Seed de planes oficiales de máquinas.
- Usuarios y wallets internas.
- JWT base.
- Máquinas: Pico Inicial, planes pagados y Aurora.
- Depósitos automáticos BSC/BEP20 por hash.
- Recompensas cada 24 horas por máquina.
- Retiros manuales por administrador.
- Referidos válidos, potencia +2.5% hasta +30% y Aurora por excedentes.
- Auditoría y administración avanzada.
- Telegram real: inicio de sesión, webhook, contacto compartido y validación de teléfono.
- Sistema de notificaciones por Telegram con reintentos.

## Estructura esperada

El repositorio debe mantenerse dentro de la carpeta raíz:

```txt
backend/
  src/
  package.json
  package-lock.json
  tsconfig.json
  .env.example
  README.md
```

## Comandos

```bash
cd backend
npm install
npm run build
npm run dev
npm run seed:machines
```

## Variables principales

Copia `.env.example` a `.env` y configura:

```env
MONGODB_URI=
JWT_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=
BSC_RPC_URL=
BSC_USDT_CONTRACT_ADDRESS=
PLATFORM_BSC_DEPOSIT_ADDRESS=
ADMIN_TELEGRAM_IDS=
```

## Telegram

### Iniciar login

```txt
POST /api/auth/telegram/start
```

Body opcional:

```json
{
  "referralCode": "AX123456"
}
```

Respuesta:

```json
{
  "botUrl": "https://t.me/<bot>?start=login_<token>",
  "verificationToken": "..."
}
```

### Webhook Telegram

```txt
POST /api/telegram/webhook?secret=<TELEGRAM_WEBHOOK_SECRET>
```

El bot debe pedir contacto y validar que:

```txt
contact.user_id === message.from.id
```

### Completar login

```txt
POST /api/auth/telegram/complete
```

Body:

```json
{
  "verificationToken": "..."
}
```

Si el usuario compartió su número correctamente desde Telegram, devuelve JWT.

## Notificaciones

Las notificaciones se guardan en MongoDB y se envían por Telegram mediante cron cada 2 minutos.

Endpoint admin/manual:

```txt
POST /api/notifications/run
```

Una falla de Telegram no rompe operaciones financieras. La notificación queda como `FAILED` y se reintenta.
