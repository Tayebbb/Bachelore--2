# Backend Changes Summary (2026-04-06)

## Scope

This document summarizes the changes made to fix backend startup and database connectivity issues.

## Files Changed

### 1) backend/db/connection.js

- Added environment-aware `DB_PORT` handling.
- Updated connection options so `instanceName` is only used when `DB_PORT` is not provided.
- Added candidate configuration logic for connection attempts.
- Added connection fallback behavior and preserved retryability by resetting rejected pool promises.

Why:

- Prevents hard dependency on SQL Browser/instance resolution when direct TCP (`host:port`) is available.

### 2) backend/config/database.js

- Updated Sequelize config to support optional `DB_PORT`.
- Changed instance usage condition so `instanceName` is only used when no `DB_PORT` is set.

Why:

- Keeps Sequelize startup behavior consistent with MSSQL client connection behavior.

### 3) backend/test-db-connection.js

- Removed hardcoded `localhost\\SQLEXPRESS`.
- Switched to environment-driven host/port/instance config.
- Applied the same port-first/instance-fallback rule as the main backend connection.

Why:

- Makes DB connectivity tests accurate for each machine and environment.

## Dependency Fixes Applied

- Installed missing package: `mssql`
- Installed missing package: `uuid`

Why:

- Backend startup failed due to missing runtime modules.

## SQL Server/User Provisioning Done

Using Windows-authenticated SQL commands, the following were ensured:

- Database exists: `BACHELORE`
- SQL login exists: `bachelore_user`
- Database user mapping exists for `bachelore_user` in `BACHELORE`
- Role assignment: `db_owner` granted to `bachelore_user`

Why:

- Startup moved from timeout errors to login errors, confirming network path was reachable; this provisioning resolved credential-level failure.

## Validation Results

- `node test-db-connection.js` succeeded.
- `npm run start` succeeded.
- Backend started in normal mode with logs indicating:
  - MSSQL connection established successfully.
  - Sequelize models synchronized.
  - Server running on port 5000.

## Notes

- The included TCP/IP enable script requires Administrator privileges. It failed previously with "Access is denied" when run without elevation.
- With the current fixes and SQL login provisioning, backend startup now works on this machine.
