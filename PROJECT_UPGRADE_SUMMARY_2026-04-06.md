# BacheLORE Project Upgrade Summary (2026-04-06)

## What Changed

### Backend

- Hardened MSSQL connection handling in `backend/db/connection.js` so the app uses port-first connection logic with fallback support instead of relying only on `SQLEXPRESS` instance resolution.
- Updated Sequelize connection configuration in `backend/config/database.js` to match the new connection behavior.
- Updated `backend/test-db-connection.js` to use environment-driven SQL settings instead of a hardcoded instance name.
- Added new API endpoints in `backend/routes/api.js` for:
  - dashboard statistics
  - SQL feature demonstrations
  - transaction-safe subscription processing
- Added schema-compatible SQL fallback logic so the API works with the live database naming style already present in the project.
- Kept activity logging tied to booking, application, and payment workflows.

### Database / SQL

- Added a single SQL delivery file: `BACHELORE_SQL_MASTERY.sql`.
- The script demonstrates:
  - PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK constraints
  - default and computed columns
  - indexes for frequent queries
  - views for dashboards and booking details
  - stored procedures for recurring workflows
  - triggers for automatic activity feed updates
  - transaction-safe payment processing
  - sample data
  - JOINs: INNER, LEFT, RIGHT, FULL OUTER
  - aggregates: COUNT, SUM, AVG, MAX, MIN with GROUP BY and HAVING
  - correlated and non-correlated subqueries
  - CROSS APPLY and OUTER APPLY

### Frontend

- Added a real `Profile` page in `frontend/src/pages/Profile.jsx`.
- Added dark mode toggle and persisted theme state in `frontend/src/components/Navbar.jsx`.
- Updated the home/dashboard page in `frontend/src/pages/Home.jsx` to show live stats from the backend.
- Updated `frontend/src/components/ActivityFeed.jsx` to pull data from the backend and refresh periodically.
- Trimmed router structure in `frontend/src/routes/router.jsx` by removing placeholder routes and wiring the real profile route.

### Package / Dependency Updates

- Installed missing backend dependencies needed for startup:
  - `mssql`
  - `uuid`
- Updated backend lockfiles and package metadata accordingly.

## Validation

- Backend starts successfully on port `5000`.
- Database connection test succeeds.
- Frontend build succeeds.
- New backend endpoints return data successfully.

## Files Added

- `BACHELORE_SQL_MASTERY.sql`
- `PROJECT_UPGRADE_SUMMARY_2026-04-06.md`
- `frontend/src/pages/Profile.jsx`

## Files Updated

- `backend/db/connection.js`
- `backend/config/database.js`
- `backend/test-db-connection.js`
- `backend/routes/api.js`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/pages/Home.jsx`
- `frontend/src/components/ActivityFeed.jsx`
- `frontend/src/routes/router.jsx`
