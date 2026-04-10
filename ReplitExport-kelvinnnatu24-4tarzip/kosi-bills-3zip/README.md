# Kosi Bills

A full-stack fintech web application for bill payments, fund transfers, and wallet management targeting the Nigerian market.

## Project Structure

```
kosi-bills/
├── backend/          # Express API (Node.js + TypeScript)
│   ├── server.ts     # All API routes and business logic
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/         # React + Vite SPA (TypeScript)
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── .env.example
└── package.json      # Root — runs both with one command
```

## Features

- **Bill Payments** — Airtime, Data, Electricity, Cable TV, Internet, Education, Betting
- **Wallet Management** — Main wallet + sub-wallets for budgeting or shared access
- **Fund Transfers** — Peer-to-peer and external withdrawals
- **Rewards System** — Points-based cashback and discounts
- **Role-Based Dashboards** — User, Admin, Agent, and Customer Care views
- **Security** — JWT (access + refresh tokens), PIN protection, BVN verification
- **AI Support Chat** — Powered by Google Gemini
- **Push Notifications** — Web Push (VAPID)
- **Email Notifications** — SMTP transactional emails

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion |
| Backend | Node.js, Express, TypeScript (`tsx`) |
| Database | SQLite (`better-sqlite3`) |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Payments | Flutterwave |
| AI | Google Gemini |
| Notifications | Web Push (VAPID), Nodemailer (SMTP) |
| SMS | Termii |

## Prerequisites

- **Node.js** v18 or later
- **npm** v8 or later

## Getting Started (Local Development)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/kosi-bills.git
cd kosi-bills
```

### 2. Install all dependencies

```bash
npm run install:all
```

Or install each separately:

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 3. Configure environment variables

**Backend:**
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and fill in the required values. Minimum required:
- `JWT_SECRET` and `JWT_REFRESH_SECRET` — use long random strings
- `BVN_ENCRYPTION_KEY` — must be exactly 32 characters

**Frontend** (optional — only if using Firebase features):
```bash
cp frontend/.env.example frontend/.env
```

### 4. Start both servers

```bash
npm run dev
```

This starts:
- **Backend API** at `http://localhost:5001`
- **Frontend** at `http://localhost:5000`

The frontend automatically proxies all `/api/*` requests to the backend — no extra configuration needed.

## Available Scripts (Root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend in development mode |
| `npm run build` | Build the frontend for production |
| `npm run start` | Start backend in production mode (serves built frontend) |
| `npm run install:all` | Install dependencies for both backend and frontend |
| `npm run lint` | Type-check both backend and frontend |

## Deployment

### Option A — Single server (simplest)

Build the frontend, then run the backend which serves it:

```bash
npm run build
NODE_ENV=production npm run start
```

The backend serves the React app from `frontend/dist/` and handles all API routes.

### Option B — Separate services

**Backend** → Deploy to [Railway](https://railway.app), [Render](https://render.com), or any Node.js host.

```bash
cd backend
npm install
npm run start
```

Set environment variables from `backend/.env.example` on your host.

**Frontend** → Deploy to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).

```bash
cd frontend
npm install
npm run build
# Deploy the `dist/` folder
```

Set `VITE_API_URL` to your deployed backend URL if needed.

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for backend variables and [`frontend/.env.example`](frontend/.env.example) for frontend variables.

### Generate VAPID keys (for push notifications)

```bash
npx web-push generate-vapid-keys
```

## Security Notes

- Never commit `.env` files — they are excluded via `.gitignore`.
- Change all default secrets before deploying to production.
- The SQLite database (`kosi_bills.db`) is auto-created on first run and is excluded from git.
- For production at scale, consider migrating to PostgreSQL or MySQL.

## License

MIT
