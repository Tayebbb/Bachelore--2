# Tailscale Shared SQL Setup

This repo is now trimmed to the Tailscale path only. Use your host PC as the single SQLEXPRESS server and point all laptops/teammates to its Tailscale IP.

## Current Host

1. Host machine: DESKTOP-L7GM9RV
2. SQL instance: .\\SQLEXPRESS
3. Tailscale IP: 100.111.12.54
4. Database: BACHELORE
5. Shared login: team_shared_dev

## What Is Kept

1. [backend/.env.example](backend/.env.example)
2. [frontend/.env.example](frontend/.env.example)
3. [backend/scripts/test-team-db-connectivity.ps1](backend/scripts/test-team-db-connectivity.ps1)
4. [backend/scripts/setup-shared-db.ps1](backend/scripts/setup-shared-db.ps1)
5. [backend/scripts/provision-shared-db.sql](backend/scripts/provision-shared-db.sql)

## Laptop and Teammate Env

Backend:

DB_HOST=100.111.12.54
DB_PORT=1433
DB_NAME=BACHELORE
DB_USER=team_shared_dev
DB_PASSWORD=TeamShared@2026!Dev
DB_INSTANCE=
DB_CONNECTION_TIMEOUT_MS=10000
DB_REQUEST_TIMEOUT_MS=30000
DB_BOOT_RETRIES=5
DB_BOOT_RETRY_DELAY_MS=3000
STRICT_DB_STARTUP=true
JWT_SECRET=CHANGE_THIS_TO_OUR_SHARED_TEAM_SECRET

Frontend:

VITE_API_BASE_URL=http://localhost:5000
VITE_API_TIMEOUT_MS=12000

## Run Order

1. On host PC, keep SQL services running and remain connected to Tailscale.
2. On laptop/teammates, copy the backend env text into `backend/.env`.
3. Copy the frontend env text into `frontend/.env`.
4. Run `npm install` in backend and frontend.
5. Run `npm run db:test` in backend.
6. Run `npm run dev` in backend.
7. Run `npm run dev` in frontend.

## Connectivity Test

```powershell
powershell -ExecutionPolicy Bypass -File .\backend\scripts\test-team-db-connectivity.ps1 -DbHost "100.111.12.54" -DbPort 1433 -DbName "BACHELORE" -DbUser "team_shared_dev" -DbPassword "TeamShared@2026!Dev"
```

## Notes

1. Prefer one SQL login per teammate if you later want auditability.
2. Keep `.env` files out of git.
3. Do not expose SQL to the public internet unless you absolutely have to.
