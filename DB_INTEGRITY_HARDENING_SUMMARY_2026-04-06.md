# DB Integrity Hardening Summary (2026-04-06)

## Scope
This update only hardens database design integrity. No frontend, routing, or business-logic code paths were changed.

## Updated DDL (Core Structural Upgrades)

### 1) Role/domain enforcement in USERS
```sql
role NVARCHAR(20) NOT NULL CHECK (UPPER(role) IN ('STUDENT', 'ADMIN'))
```
Rationale: prevents invalid actor types and keeps authorization data clean.

### 2) Booking lifecycle columns in booked tables
```sql
booking_status NVARCHAR(20) NOT NULL DEFAULT 'confirmed'
```
Applied to: `BOOKEDTUITIONS`, `BOOKEDMAIDS`, `BOOKEDROOMMATES`.
Rationale: records normalized booking state without relying on implicit app logic.

### 3) Cascade-safe foreign key definitions
```sql
FOREIGN KEY (...) REFERENCES ... ON UPDATE CASCADE ON DELETE CASCADE
```
Applied across parent-child ownership paths (users -> listings/payments/activities, listing -> applications -> bookings, house -> contacts).
Rationale: enforces referential integrity automatically and prevents orphan rows.

## Added/Enforced Constraints

### Domain CHECK constraints
- `CK_USERS_ROLE_DOMAIN`: `UPPER(role) IN ('ADMIN', 'STUDENT')`
- `CK_SUBPAY_STATUS_DOMAIN`: payment status domain
- `CK_SUBPAY_AMOUNT_DOMAIN`: `amount > 0`
- `CK_TUITIONS_STATUS_DOMAIN`: tuition workflow status domain
- `CK_MAIDS_STATUS_DOMAIN`: maid workflow status domain
- `CK_ROOMMATES_STATUS_DOMAIN`: roommate workflow status domain
- `CK_HOUSE_STATUS_DOMAIN`: house listing workflow status domain
- `CK_MARKET_STATUS_DOMAIN`: marketplace workflow status domain
- `CK_BOOKEDTUITIONS_STATUS_DOMAIN`: booking status domain
- `CK_BOOKEDMAIDS_STATUS_DOMAIN`: booking status domain
- `CK_BOOKEDROOMMATES_STATUS_DOMAIN`: booking status domain

Rationale: constrains all lifecycle states to approved finite sets, strengthening 3NF-safe domain consistency.

### Numeric integrity checks
- Salary/rent/price/amount/rooms positivity checks were enforced where applicable.

Rationale: blocks physically invalid transactional values at the data layer.

## Referential Actions (Cascade Rules)

Foreign keys were normalized to explicit `ON UPDATE CASCADE ON DELETE CASCADE` on critical chains:
- `USERS -> ANNOUNCEMENTS`
- `USERS -> SUBSCRIPTIONPAYMENTS`
- `USERS -> USERACTIVITIES`
- `USERS -> TUITIONS/MAIDS/ROOMMATELISTINGS/HOUSERENTLISTINGS/MARKETPLACELISTINGS`
- `TUITIONS -> APPLIEDTUITIONS -> BOOKEDTUITIONS`
- `MAIDS -> APPLIEDMAIDS -> BOOKEDMAIDS`
- `ROOMMATELISTINGS -> APPLIEDROOMMATES -> BOOKEDROOMMATES`
- `HOUSERENTLISTINGS -> HOUSECONTACTS`
- `USERS -> HOUSECONTACTS`

Rationale: preserves referential correctness during updates/deletes and keeps ownership trees coherent.

## Added Indexes (Performance + Integrity Support)

- `IX_USERS_ROLE_CREATED_AT`
- `IX_ANNOUNCEMENTS_CREATED_BY`
- `IX_TUITIONS_USER_STATUS_CREATED`
- `IX_MAIDS_USER_STATUS_CREATED`
- `IX_ROOMMATES_USER_STATUS_CREATED`
- `IX_HOUSE_USER_STATUS_CREATED`
- `IX_MARKET_USER_STATUS_CREATED`
- `IX_SUBPAY_USER_STATUS_DATE`
- `IX_AT_USER_STATUS_APPLIED`
- `IX_AM_USER_STATUS_APPLIED`
- `IX_AR_USER_STATUS_APPLIED`

Rationale: improves query plans for high-frequency admin/student filters and FK-linked status timelines.

## Files Updated
- `backend/db/schema.js`
- `BACHELORE_COMPLETE_SYSTEM.sql`
