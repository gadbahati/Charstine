# Charstine Admin Inventory & Rental System

This repository now includes a secure admin-only inventory and rental management backend + dashboard integrated into the existing hotel website.

## Features

- Admin menu link added to `index.html`
- Single admin login only (`Charstinehoteltourist@gmail.com`)
- Bcrypt password hashing
- Session-based authentication (no public user signup)
- Rate-limited login endpoint
- Inventory CRUD
- Rental logging with automatic inventory quantity deduction
- Daily + weekly rental report summaries

## Tech Stack

- Frontend: Tailwind CSS + Vanilla JavaScript
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: `express-session` + `bcrypt`

## Files Added/Updated

- `index.html` (updated with Admin link)
- `admin-login.html`
- `admin-dashboard.html`
- `server.js`
- `schema.sql`
- `package.json`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create PostgreSQL database (example name: `charstine`).

3. Run SQL schema:

```bash
psql -U postgres -d charstine -f schema.sql
```

4. Set environment variables (PowerShell example):

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/charstine"
$env:SESSION_SECRET="replace-with-strong-secret"
$env:ADMIN_EMAIL="Charstinehoteltourist@gmail.com"
$env:ADMIN_PASSWORD="Resort254"
```

5. Start server:

```bash
node server.js
```

6. Open:

- Public site: `http://localhost:3000/index.html`
- Admin login: `http://localhost:3000/admin-login.html`

## Deployment Notes (Vercel / Railway / Heroku)

- Ensure `DATABASE_URL` and `SESSION_SECRET` are set in your hosting environment.
- On Vercel, admin APIs are served from `/api/*` serverless routes. The admin pages auto-detect production and call these API routes.
- For production, keep `NODE_ENV=production` so cookies are secure.
- You can start with `node server.js` or `npm start`.

## Security Notes

- Only one admin account is used.
- No account registration endpoint exists.
- All admin APIs require an authenticated admin session.
