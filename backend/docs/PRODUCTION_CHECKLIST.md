# Production Checklist

## Before deploy

- [ ] Set all required Railway variables from `docs/ENVIRONMENT.md`.
- [ ] Verify `NODE_ENV=production`.
- [ ] Verify `TRUST_PROXY=true` if deployed behind Railway proxy.
- [ ] Verify `CORS_ORIGINS` contains only the production frontend URL.
- [ ] Verify Telegram webhook is configured to `/api/telegram/webhook`.
- [ ] Verify official BSC USDT contract address.
- [ ] Verify platform deposit wallet address.
- [ ] Run `npm run build`.
- [ ] Run `npm test`.
- [ ] Run `npm run check:readiness`.
- [ ] Run `npm audit --omit=dev`.
- [ ] Run `npm run seed:machines` once after MongoDB is connected.

## Operational rules

- Admin does not manually activate paid machines.
- Paid machines activate only after automatic BSC/BEP20 deposit verification.
- Withdrawals are manual and require admin tx hash.
- Jobs must be protected with persistent locks.
- Risk flags should be reviewed by admin; MVP does not auto-block users.

## Financial invariants

- Machine payout max is 200% of activation amount or virtual principal.
- Pico Inicial and Aurora do not receive referral power.
- Only paid machines receive power.
- Referral power caps at +30%.
- Reward payout must never exceed remaining payout.
- A withdrawal moves funds from available to locked before admin review.
