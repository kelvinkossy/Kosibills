# Kosi Bills

A full-stack Nigerian bill payment platform built with React + TypeScript (Vite) frontend and Node.js/Express backend.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide React
- **Backend**: Node.js, Express, TypeScript (tsx), SQLite (better-sqlite3)
- **Auth**: JWT, bcryptjs, cookie-parser
- **Payments**: Flutterwave
- **SMS**: Termii
- **Email**: Nodemailer
- **Push Notifications**: Web Push API
- **State**: @tanstack/react-query

## Project Structure

```
kosi-bills-3zip/
├── server.ts              # Express backend (API routes, DB, payment logic)
├── src/
│   ├── App.tsx            # Main app entry, routing, state management
│   ├── types.ts           # TypeScript types
│   ├── components/
│   │   ├── landing/       # Public landing page (LandingPage.tsx)
│   │   ├── auth/          # Splash, Auth, Onboarding, ResetPassword
│   │   ├── common/        # Logo, shared components
│   │   ├── dashboard/     # Dashboard, AdminDashboard, AgentDashboard, CustomerCareDashboard
│   │   ├── payments/      # Airtime, Data, Electricity, CableTV, Bills, etc.
│   │   ├── history/       # Transaction history
│   │   ├── rewards/       # Rewards system
│   │   ├── settings/      # Settings, Terms, Policies
│   │   └── support/       # SupportChat
│   ├── hooks/             # useDashboardData
│   ├── services/          # dashboardService
│   └── utils/             # storage, seasons
└── vite.config.ts
```

## App Flow

1. **Landing Page** — shown to new/logged-out visitors (professional marketing page)
2. **Splash** — shown when returning user session detected
3. **Auth** — login/register
4. **Onboarding** — first-time user setup
5. **App** — main dashboard and features

## Running the App

```bash
cd kosi-bills-3zip && npm run dev
```

Runs on port 5000.

## Features

- Bill payments: airtime, data, electricity, cable TV, internet, betting, education
- Wallet system with balance tracking
- Rewards/cashback points
- Transaction history
- Multi-role: User, Agent, Admin, Customer Care
- Push notifications (Web Push / VAPID)
- Dark/light mode
- Flutterwave payment integration
- AI support chat (Gemini 2.0 Flash with local fallback)
- Support ticket system (user → customer care escalation)

## Security Architecture (Post-Audit Hardening)

### Authentication & Session
- JWT access tokens: **1-hour expiry** (down from 7 days)
- Refresh tokens: 30-day rotation (SHA-256 hashed in DB, invalidated on use)
- Secure httpOnly cookies for both token types
- Session token stored in DB — invalidated on logout
- Logout endpoint clears both cookies and deletes refresh token from DB

### Data Protection
- **BVN encrypted at rest** using AES-256-GCM (key from `BVN_ENCRYPTION_KEY` env var)
- BVN masked in all API responses (only first 2 + last 2 digits visible)
- `sanitizeUser()` helper strips `password`, `pin`, `session_token`, `verification_token`, `reset_token` from all responses
- PIN hashed with bcrypt (10 rounds); legacy plaintext PINs supported for comparison

### Input Validation & Rate Limiting
- PIN strength enforced: blocks sequential/repeating patterns (1234, 0000, 1111, etc.)
- Password minimum 8 characters enforced on register and update
- PIN verify endpoint rate-limited: 5 attempts per 15 min (failures only counted)
- Payment/transfer endpoints rate-limited: 20 requests per 15 min
- All financial amounts validated as positive finite numbers
- PIN format validated as exactly 4 digits

### Idempotency
- Payment and transfer endpoints support `Idempotency-Key` request header
- Duplicate requests return cached response without re-processing
- Keys stored per-user per-endpoint in `idempotency_keys` table

### Audit & Security Events
- `security_events` table: tracks LOGIN_SUCCESS, LOGIN_FAILED, GOOGLE_LOGIN, 2FA_LOGIN_SUCCESS, PIN_VERIFY_FAILED, PAYMENT_PIN_FAILED, TRANSFER_PIN_FAILED, REGISTER, LOGOUT
- Every event includes: user_id, event_type, IP address, user agent, timestamp, details
- Structured JSON logging via **winston** (replaces raw console.log)

### Environment Validation
- On startup: validates `JWT_SECRET` and `BVN_ENCRYPTION_KEY` are set
- In production mode: **refuses to start** if critical vars are missing
- Logs warnings for all optional-but-recommended env vars

### Additional Security
- `requireAdmin` / `requireCustomerCare` middleware cross-validates JWT identity
- All user-specific routes require authenticateToken + userId match
- SQLite WAL mode + atomic `db.transaction()` for all financial operations
- Parameterized queries throughout (no SQL injection surface)
- `sortBy` fields allowlisted in dynamic ORDER BY clauses

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | Production required | JWT access token signing |
| `JWT_REFRESH_SECRET` | Production required | JWT refresh token signing |
| `BVN_ENCRYPTION_KEY` | Production required | AES-256 key for BVN encryption (any 32+ char string) |
| `VITE_FLW_PUBLIC_KEY` | Recommended | Flutterwave public key (frontend) |
| `FLW_SECRET_KEY` | Recommended | Flutterwave secret key (backend verification) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Optional | Email (graceful fallback if missing) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Optional | Web push notifications |
| `TERMII_API_KEY` | Optional | SMS via Termii |
| `GEMINI_API_KEY` | Optional | AI support chat (falls back to local responses) |
