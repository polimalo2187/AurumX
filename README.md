# AurumX Backend

Backend de AurumX Mining construido con Node.js, Express, TypeScript, MongoDB/Mongoose y verificación automática de depósitos USDT BEP20 en BSC.

## Versión

`0.11.0`

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
- Endurecimiento de producción: CORS controlado, rate limit, saneamiento anti NoSQL injection, validaciones más estrictas y locks persistentes para jobs.
- RiskService antifraude básico: alertas por wallet de retiro compartida, demasiados retiros pequeños y picos de referidos válidos.

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

## Validaciones realizadas en esta entrega

```bash
npm install
npm run build
npm audit --omit=dev
```

Resultado esperado:

```txt
TypeScript compila correctamente.
0 vulnerabilidades en dependencias de producción.
```

## Variables principales

Copia `.env.example` a `.env` y configura:

```env
NODE_ENV=production
PORT=8080
TRUST_PROXY=true

MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=30d

TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=

APP_PUBLIC_URL=
FRONTEND_URL=
CORS_ORIGINS=

BSC_RPC_URL=
BSC_CHAIN_ID=56
BSC_USDT_CONTRACT_ADDRESS=
PLATFORM_BSC_DEPOSIT_ADDRESS=
MIN_BSC_CONFIRMATIONS=12

INTERNAL_JOB_SECRET=
JOB_LOCK_TTL_SECONDS=120

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=300
STRICT_RATE_LIMIT_MAX_REQUESTS=30
TELEGRAM_RATE_LIMIT_MAX_REQUESTS=120

RISK_SHARED_WITHDRAWAL_WALLET_USER_COUNT=2
RISK_SMALL_WITHDRAWAL_USDT=2
RISK_SMALL_WITHDRAWAL_COUNT_7D=3
RISK_REFERRAL_SPIKE_COUNT_24H=8

ADMIN_TELEGRAM_IDS=
```

## Variables obligatorias en producción

En producción, el backend se niega a arrancar si faltan:

```txt
TELEGRAM_BOT_TOKEN
TELEGRAM_BOT_USERNAME
TELEGRAM_WEBHOOK_SECRET
APP_PUBLIC_URL
FRONTEND_URL
BSC_RPC_URL
BSC_USDT_CONTRACT_ADDRESS
PLATFORM_BSC_DEPOSIT_ADDRESS
INTERNAL_JOB_SECRET
```

## Seguridad agregada en v0.10.0

### CORS controlado

En producción solo se aceptan orígenes definidos en:

```env
CORS_ORIGINS=https://tu-frontend.com,https://otro-dominio.com
```

### Rate limit

Se aplica rate limit global y rate limit estricto en rutas sensibles:

```txt
/api/auth
/api/deposits
/api/withdrawals
/api/telegram
```

### Saneamiento de payload

Se rechazan claves peligrosas en `body`, `query` y `params`, por ejemplo:

```txt
$ne
$gt
profile.name
```

Esto reduce riesgo de NoSQL injection.

### Jobs con lock persistente

Los jobs usan `JobLock` en MongoDB para evitar ejecuciones simultáneas entre varias instancias:

```txt
reward-cron
deposit-verification-cron
notification-cron
```

### Endpoints internos protegidos

Estos endpoints aceptan admin autenticado o header interno:

```txt
x-internal-job-secret: <INTERNAL_JOB_SECRET>
```

Aplica a:

```txt
POST /api/rewards/run
POST /api/notifications/run
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

## Nota sobre secretos

`TELEGRAM_BOT_TOKEN`, `JWT_SECRET`, `INTERNAL_JOB_SECRET` y credenciales reales nunca deben subirse al repositorio. Deben configurarse en Railway o en el proveedor de entorno.


## RiskService antifraude

La versión `0.11.0` agrega alertas de riesgo sin bloqueo automático. El sistema marca cuentas para revisión admin cuando detecta:

```txt
- Misma wallet de retiro usada por múltiples usuarios.
- Demasiados retiros pequeños en 7 días.
- Pico alto de referidos válidos en 24 horas.
```

Endpoints admin:

```txt
GET  /api/admin/risk/summary
GET  /api/admin/risk/flags
GET  /api/admin/risk/flags/:id
POST /api/admin/risk/flags/:id/resolve
POST /api/admin/risk/flags/:id/ignore
POST /api/admin/risk/users/:id/evaluate
```

El RiskService no bloquea pagos, depósitos ni retiros automáticamente. Solo crea señales auditables y marca `riskFlagged`, `riskLevel`, `riskScore` y `riskFlagsCount` en el usuario para revisión operativa.
