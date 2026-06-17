# AurumX Backend API

Base path: `/api`

## Auth / Telegram

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | `/auth/status` | No | API auth module status. |
| POST | `/auth/telegram/start` | No | Creates a Telegram login session and returns the bot login URL. |
| POST | `/auth/telegram/complete` | No | Completes Telegram login and returns JWT after phone verification. |
| POST | `/telegram/webhook` | Telegram secret | Receives Telegram bot updates. |

Development-only endpoints are blocked in production:

| Method | Path | Description |
|---|---|---|
| POST | `/auth/dev/telegram-verify` | Local/dev verification helper. |
| POST | `/auth/dev/issue-token` | Local/dev token helper. |

## User

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | `/users/me` | User | Current user profile. |
| GET | `/users/me/dashboard` | User | Wallet, machines, referrals and withdrawal summary. |

## Machines

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | `/machines/plans` | No | Lists active machine plans. |
| GET | `/machines/my` | User | Lists user machines. |
| POST | `/machines/free/claim` | User | Claims Pico Inicial once per verified user. |

## Deposits

| Method | Path | Auth | Description |
|---|---|---:|---|
| POST | `/deposits/orders` | User | Creates a BSC/BEP20 USDT deposit order for a paid machine. |
| POST | `/deposits/orders/:id/submit-hash` | User | Submits tx hash and starts automatic BSC verification. |
| GET | `/deposits/my` | User | Lists user deposit orders. |

Automatic deposit verification validates: transaction exists, status success, official BSC USDT contract, receiver is platform wallet, amount is enough, hash is unique, and confirmations are sufficient.

## Rewards

| Method | Path | Auth | Description |
|---|---|---:|---|
| POST | `/rewards/run` | Admin or internal secret | Processes due machine rewards. Cron also runs this flow internally. |

## Wallet

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | `/wallet/me` | User | Current available and locked balance. |
| GET | `/wallet/transactions` | User | Wallet transaction history. |

## Withdrawals

| Method | Path | Auth | Description |
|---|---|---:|---|
| POST | `/withdrawals` | User | Requests a manual BEP20 withdrawal. |
| GET | `/withdrawals/my` | User | User withdrawal history. |

Rules: minimum 1 USDT, one pending withdrawal per user, one request every 24 hours.

## Referrals

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | `/referrals/me` | User | Referral dashboard and referred users. |
| GET | `/referrals/rewards/status` | User | Aurora reward machine status. |
| POST | `/referrals/rewards/claim-machine` | User | Claims Aurora using 10 available extra valid referrals. |

## Notifications

| Method | Path | Auth | Description |
|---|---|---:|---|
| POST | `/notifications/run` | Admin or internal secret | Processes pending Telegram notifications. |

## Admin

All admin endpoints require a valid JWT with role `ADMIN`.

| Method | Path | Description |
|---|---|---|
| GET | `/admin/dashboard` | Admin dashboard summary. |
| GET | `/admin/users` | List users. |
| GET | `/admin/users/:id` | User detail. |
| POST | `/admin/users/:id/block` | Block user. |
| POST | `/admin/users/:id/unblock` | Unblock user. |
| GET | `/admin/deposits` | List deposits by status. |
| GET | `/admin/deposits/:id` | Deposit detail. |
| POST | `/admin/deposits/:id/retry-verification` | Retry BSC verification. |
| POST | `/admin/deposits/:id/reject` | Reject deposit in review/invalid state. |
| GET | `/admin/withdrawals/pending` | List pending withdrawals. |
| POST | `/admin/withdrawals/:id/approve` | Approve withdrawal with BEP20 tx hash. |
| POST | `/admin/withdrawals/:id/reject` | Reject withdrawal and unlock balance. |
| GET | `/admin/audit-logs` | List audit logs. |
| GET | `/admin/risk/summary` | Risk summary. |
| GET | `/admin/risk/flags` | List risk flags. |
| GET | `/admin/risk/flags/:id` | Risk flag detail. |
| POST | `/admin/risk/flags/:id/resolve` | Resolve risk flag. |
| POST | `/admin/risk/flags/:id/ignore` | Ignore risk flag. |
| POST | `/admin/risk/users/:id/evaluate` | Manually evaluate user risk. |
