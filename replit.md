# Kosi Bills App

## Overview
A full-stack bill management application built with React + TypeScript (frontend) and Express + TypeScript (backend), using SQLite for local data storage.

## Architecture

### Frontend
- React 19 with TypeScript
- Vite for bundling and dev server
- Tailwind CSS for styling
- TanStack Query for data fetching
- Recharts for data visualization
- Framer Motion for animations

### Backend
- Express.js server (`server.ts`)
- better-sqlite3 for SQLite database (`kosi_bills.db`)
- JWT authentication
- Bcrypt for password hashing
- Nodemailer for email
- Winston for logging
- Firebase integration

### Key Directories
- `src/` - React frontend source
  - `components/` - UI components
  - `hooks/` - Custom React hooks
  - `services/` - API service functions
  - `utils/` - Utility functions
  - `assets/` - Static assets
- `public/` - Static public files
- `server.ts` - Express backend server
- `kosi_bills.db` - SQLite database

## Running the App
- `npm run dev` - Starts the Express server (port 5000)
- `npm run build` - Builds the frontend

## Environment Variables
See `.env.example` for required environment variables.
