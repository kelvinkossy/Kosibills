# Kosi Bills

Nigeria's smartest full-stack FinTech platform — digital wallet, bill payments, AI assistant, rewards, user-to-user transfers, sub-wallets, and multi-role dashboards.

## Architecture

- **Frontend**: React 19 + Vite, Tailwind CSS v4, motion/react (v12), Recharts
- **Backend**: Express + Node.js (`tsx server.ts`), SQLite (better-sqlite3)
- **Auth**: JWT cookies, bcrypt, optional 2FA (Termii SMS), Google OAuth via Firebase
- **Payments**: Flutterwave for wallet funding and bill payments
- **Transfers**: Built-in user-to-user transfer via phone number lookup with PIN auth
- **AI**: Google Gemini AI for financial insights + local fallback responses
- **Notifications**: Web Push (VAPID) + Nodemailer email receipts

## Running the App

```bash
npm run dev
```

Starts the Express server on port **5000**, serving Vite in middleware mode for hot-reloading.

## Key Files

- `server.ts` — Monolithic backend: DB init, all API routes, auth, payments, transfers, email
- `src/App.tsx` — Root: routing, header, bottom nav, notifications, dark mode
- `src/components/auth/Auth.tsx` — Premium split-panel login/register with Google OAuth, 2FA
- `src/components/dashboard/Dashboard.tsx` — Main user dashboard
- `src/components/dashboard/DashboardWalletCard.tsx` — Banking-style card with tier colors
- `src/components/dashboard/DashboardQuickActions.tsx` — Service icon grid (9 services)
- `src/components/dashboard/DashboardRecentTransactions.tsx` — Type-aware transaction list
- `src/components/dashboard/DashboardInsightsWidget.tsx` — AI tips and budget tracking
- `src/components/payments/Transfer.tsx` — User-to-user money transfer (4-step flow)
- `src/components/rewards/Rewards.tsx` — Points, tier progress, referrals, agent program
- `src/components/dashboard/AdminDashboard.tsx` — Full admin portal
- `src/components/dashboard/AgentDashboard.tsx` — Agent portal with commissions
- `src/components/dashboard/CustomerCareDashboard.tsx` — CC portal with ticket management

## Views & Navigation

Bottom nav adapts per role:
- **User**: Home, Bills, Rewards, Settings
- **Agent**: Agent, Bills, History, Settings
- **CC/Admin**: Dashboard, Bills, History, Settings

Key views: `dashboard`, `bills`, `transfer`, `airtime`, `data`, `electricity`, `cable`, `betting`, `internet`, `education`, `other-utilities`, `history`, `sub-wallets`, `rewards`, `settings`, `support`, `admin`, `agent`, `customer_care`, `kosi-ai`

## API Endpoints

- `GET /api/users/find?phone=...` — Find user by phone (for transfers)
- `POST /api/transfer` — User-to-user transfer with PIN verification
- `GET /api/agent/stats/:userId` — Agent commission stats
- `GET /api/agent/referrals/:userId` — Agent referral list
- `POST /api/customer-care/users/:id/freeze` — Freeze/unfreeze user
- `PATCH /api/support/tickets/:id/status` — Update ticket status

## Environment Variables

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini AI |
| `VITE_FLW_PUBLIC_KEY` | Flutterwave public key (frontend) |
| `FLW_SECRET_KEY` | Flutterwave secret key (backend) |
| `JWT_SECRET` | JWT signing secret |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Email receipts |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Web Push notifications |
| `TERMII_API_KEY` | 2FA SMS (optional) |

## Database

SQLite (`kosi_bills.db`) auto-created on first run. Key tables: `users`, `transactions`, `notifications`, `sub_wallets`, `rewards`, `support_tickets`, `support_messages`, `push_subscriptions`.

## Design System

- **Colors**: Emerald (#059669) primary, slate dark theme
- **Fonts**: Inter (loaded via Google Fonts in index.html)
- **Cards**: `.card` class — white/slate-900 with border and subtle shadow
- **Animations**: motion/react for entrance animations, spring transitions
- **Dark mode**: Toggled via `.dark` class on `<html>`, persisted in localStorage

## Notes

- All `motion` imports must use `motion/react` (NOT `framer-motion`)
- Transfer requires user to have a PIN set first
- Agent dashboard requires `isAgent: true` on user record
- Admin dashboard requires `isAdmin: true` on user record
