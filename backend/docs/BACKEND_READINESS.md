# Backend Readiness Status

AurumX backend includes the production-critical modules required before frontend integration:

- Express + TypeScript base.
- MongoDB/Mongoose models.
- Telegram real login and phone verification flow.
- Machine plans seed.
- Pico Inicial claim.
- Automatic BSC/BEP20 USDT deposit verification.
- Paid machine activation after valid deposit.
- 24-hour reward cycle per machine.
- Wallet transaction ledger.
- Manual withdrawals with admin tx hash.
- Referral power system.
- Aurora reward machine by extra referrals.
- Audit logs.
- Admin dashboard and user/deposit/withdrawal/risk views.
- Notifications.
- Risk flags.
- Rate limit, sanitization and internal job protection.
- Job locks.
- Unit tests for economic and referral invariants.

Remaining before public launch:

- End-to-end testing against a real BSC RPC provider.
- Telegram webhook test with the real bot.
- Manual QA of admin flows.
- Frontend integration.
