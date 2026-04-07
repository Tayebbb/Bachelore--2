# Advanced DB Upgrade Report (2026-04-06)

## Scope
This upgrade only adds advanced database features and backend SQL integration.
No frontend UI or route structure was changed in this task.

## Files Updated
- backend/db/schema.js
- backend/routes/student.js
- backend/routes/admin.js
- BACHELORE_COMPLETE_SYSTEM.sql

---

## New / Enhanced Stored Procedures

1. dbo.sp_student_subscription_payment
- Purpose: student subscription payment flow.
- SQL features:
  - BEGIN TRANSACTION / COMMIT / ROLLBACK
  - Inserts pending payment, upgrades to paid
  - Activates user subscription
  - Writes activity log
  - Returns status_code + status_message + payment_id

2. dbo.sp_submit_tuition_application
- Purpose: submit tuition application with safeguards.
- SQL features:
  - BEGIN TRANSACTION / COMMIT / ROLLBACK
  - Validates listing availability
  - Prevents self-application and duplicate active application
  - Inserts application
  - Writes activity logs for applicant and listing owner
  - Returns status_code + status_message + application_id

3. dbo.sp_process_maid_booking
- Purpose: maid booking completion flow.
- SQL features:
  - BEGIN TRANSACTION / COMMIT / ROLLBACK
  - Inserts into BOOKEDMAIDS
  - Updates APPLIEDMAIDS status to booked
  - Updates MAIDS status to Booked
  - Writes activity logs for student and actor
  - Returns status_code + status_message + booking_id

4. dbo.sp_process_roommate_booking
- Purpose: roommate booking completion flow.
- SQL features:
  - BEGIN TRANSACTION / COMMIT / ROLLBACK
  - Inserts into BOOKEDROOMMATES
  - Updates APPLIEDROOMMATES status to booked
  - Updates ROOMMATELISTINGS status to Booked
  - Writes activity logs for student and actor
  - Returns status_code + status_message + booking_id

5. dbo.sp_marketplace_purchase_transaction
- Purpose: marketplace purchase transaction.
- SQL features:
  - BEGIN TRANSACTION / COMMIT / ROLLBACK
  - Validates availability and disallows self-purchase
  - Updates item status to sold
  - Writes activity logs for buyer and seller
  - Returns status_code + status_message + item_id

6. dbo.sp_admin_review_listing (enhanced)
- Purpose: admin approval/rejection workflow for all listing modules.
- SQL features:
  - BEGIN TRANSACTION / COMMIT / ROLLBACK
  - Validates listing type and existence
  - Updates listing status
  - Logs both admin action and owner-facing action
  - Returns status_code + status_message + updated_status

---

## New Update Triggers

1. dbo.trg_tuitions_status_update
- Logs Pending -> Approved/Rejected transitions.

2. dbo.trg_maids_status_update
- Logs Pending -> Approved/Rejected transitions.

3. dbo.trg_roommates_status_update
- Logs Pending -> Approved/Rejected transitions.

4. dbo.trg_marketplace_status_update
- Logs Pending -> Approved/Rejected transitions.

5. dbo.trg_applied_tuition_status_update
- Logs booking/application status changes.

6. dbo.trg_applied_maid_status_update
- Logs booking/application status changes.

7. dbo.trg_applied_roommate_status_update
- Logs booking/application status changes.

8. dbo.trg_users_subscription_status_update
- Logs subscription activation/deactivation changes.

Each trigger writes into USERACTIVITIES with:
- user_id
- action_type
- reference_table
- reference_id
- activity_description
- timestamp (default)

---

## New Delete Triggers

1. dbo.trg_tuitions_delete_audit
- Logs deletion of tuition listings.

2. dbo.trg_marketplace_delete_audit
- Logs deletion of marketplace listings.

---

## Updated Views

1. dbo.vw_admin_dashboard_summary
- Added grouped and computed admin analytics:
  - total_students, total_admins
  - pending_listing_reviews
  - total_revenue, paid_payment_count, avg_payment_value
  - current_month_revenue
  - active_users_7d, active_users_30d

2. dbo.vw_student_dashboard
- Added richer per-student metrics:
  - pending_applications
  - activity_count_30d
  - last_activity_at
  - current_month_spend
  - aggregate totals for applications/bookings/listings/payments

---

## Backend APIs Now Using Stored Procedures

### Student APIs
- POST /api/student/subscription/pay
  - Uses dbo.sp_student_subscription_payment

- POST /api/student/tuitions/:tuitionId/apply
  - Uses dbo.sp_submit_tuition_application

- POST /api/student/maids/applications/:applicationId/book
  - Uses dbo.sp_process_maid_booking

- POST /api/student/roommates/applications/:applicationId/book
  - Uses dbo.sp_process_roommate_booking

- POST /api/student/marketplace/:itemId/buy
  - Uses dbo.sp_marketplace_purchase_transaction

### Admin APIs
- POST /api/admin/listings/review
  - Uses enhanced dbo.sp_admin_review_listing

---

## Advanced SQL Usage Applied in Backend Queries

1. backend/routes/admin.js
- /dashboard now returns:
  - view-based overview
  - grouped revenue breakdown (GROUP BY + HAVING)
  - activity leader board (JOIN + GROUP BY + HAVING)

2. backend/routes/student.js
- /dashboard now returns:
  - view-based overview
  - grouped user action summary (GROUP BY + HAVING)
  - module-wise application breakdown via UNION ALL subquery + GROUP BY

---

## SQL Script Coverage
The complete SQL demonstration file now includes these upgrades and remains the single runnable script:
- BACHELORE_COMPLETE_SYSTEM.sql

It contains:
- DDL
- Seed data
- Constraints and indexes
- Views
- Stored procedures
- Triggers
- Transactions
- Complex query demonstrations
