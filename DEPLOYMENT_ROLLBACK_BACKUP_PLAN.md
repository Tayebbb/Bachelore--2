# Deployment, Backup, and Rollback Plan

## Deployment Steps
1. Provision MSSQL instance and create database `BacheLORE`.
2. Configure backend `.env` from `backend/.env.example`.
3. Install backend dependencies and run schema sync:
   - `npm install`
   - `npm run db:sync`
4. (Optional) Migrate legacy Mongo data:
   - `npm run db:migrate:data`
5. Start backend server:
   - `npm run start`
6. Configure frontend `.env` from `frontend/.env.example`.
7. Build frontend for production:
   - `npm install`
   - `npm run build`
8. Deploy backend and frontend (Railway/Render/Azure/Vercel supported).

## Backup Strategy
1. Schedule MSSQL full backups daily and differential backups every 6 hours.
2. Retain backups for 30 days minimum.
3. Store backup artifacts in offsite blob/object storage.
4. Export critical audit tables weekly (`SubscriptionPayments`, `BookedTuitions`, `BookedMaids`, `BookedRoommates`).

## Rollback Plan
1. Keep previous backend container/image and frontend build artifact tagged.
2. If failure detected:
   - Switch traffic to previous backend release.
   - Restore previous frontend build.
3. For data regressions:
   - Stop write traffic.
   - Restore latest valid MSSQL backup.
   - Re-run selective migration replay if needed.
4. Validate rollback with smoke tests:
   - `/health`
   - `/api/announcements`
   - `/api/marketplace`
   - `/api/tuitions`

## Post-Deployment Validation
1. Run integration tests: `npm test` in backend.
2. Run load test: `k6 run backend/tests/load-100-users.js`.
3. Verify P95 API latency and error rate thresholds.
