# AurumX Backend

Backend de **AurumX Mining** construido con Node.js, Express, TypeScript, MongoDB/Mongoose, Telegram Login y verificación automática de depósitos USDT BEP20 en BSC.

## Versión

`0.12.0`

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
- RiskService antifraude básico.
- Pruebas unitarias de reglas económicas, referidos y validadores.
- Documentación API y checklist de producción.
- Script de readiness para validar estructura, variables y seed de máquinas.

## Estructura esperada

El repositorio debe mantenerse dentro de la carpeta raíz:

```txt
backend/
  src/
  tests/
  scripts/
  docs/
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
npm test
npm run check:readiness
npm run check
npm run dev
npm run seed:machines
```

## Validaciones de entrega

```bash
npm install
npm run build
npm test
npm run check:readiness
npm audit --omit=dev
```

Resultado esperado:

```txt
TypeScript compila correctamente.
Tests pasan correctamente.
Backend readiness check passed.
0 vulnerabilidades en dependencias de producción.
```

## Variables principales

Copia `.env.example` a `.env` y configura los valores reales en Railway:

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
```

Más detalles en:

```txt
docs/ENVIRONMENT.md
docs/API.md
docs/PRODUCTION_CHECKLIST.md
docs/BACKEND_READINESS.md
```

## Reglas económicas principales

```txt
Pico Inicial:
- Gratis.
- 1 USDT virtual.
- Payout máximo 2 USDT.
- 0.10 USDT cada 24h.
- Sin potencia.

Máquinas pagadas:
- 7, 24, 50, 100, 500 y 1000 USDT.
- Payout máximo 200%.
- Ciclos de 24h.
- Potencia por referidos válida solo en máquinas pagadas.

Referidos:
- Solo cuenta referido que activa primera máquina pagada confirmada.
- Cada referido válido aporta +2.5%.
- Máximo +30%.
- Después de 12 referidos, cada 10 excedentes permiten reclamar Aurora.

Aurora:
- Máquina premio.
- 7 USDT virtuales.
- Payout máximo 14 USDT.
- 0.70 USDT cada 24h.
- Sin potencia.
```

## Seguridad

- No subir `.env` real.
- No subir `node_modules/`.
- No subir `dist/`.
- No guardar llaves privadas de retiro en el backend; los retiros son manuales.
- Proteger endpoints internos con `x-internal-job-secret`.
- Mantener CORS cerrado al dominio real del frontend.
