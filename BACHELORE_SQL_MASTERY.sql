/*
  BacheLORE SQL Mastery Script
  Purpose:
  - Demonstrate core and advanced MSSQL features for grading coverage.
  - Keep proposal entities intact while adding reusable DB automation.
  Notes:
  - Run on SQL Server for database BACHELORE.
*/

USE [BACHELORE];
GO

/* =============================
   1) Schema hardening examples
   ============================= */

/* CHECK + DEFAULT + computed column demonstration */
IF COL_LENGTH('dbo.SUBSCRIPTIONPAYMENTS', 'vat_amount') IS NULL
BEGIN
  ALTER TABLE dbo.SUBSCRIPTIONPAYMENTS
  ADD vat_amount AS CAST(amount * 0.15 AS DECIMAL(10,2));
END;
GO

IF COL_LENGTH('dbo.SUBSCRIPTIONPAYMENTS', 'payment_ref') IS NULL
BEGIN
  ALTER TABLE dbo.SUBSCRIPTIONPAYMENTS
  ADD payment_ref NVARCHAR(50) NULL;
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.check_constraints
  WHERE name = 'CK_SUBSCRIPTIONPAYMENTS_AMOUNT_POSITIVE'
)
BEGIN
  ALTER TABLE dbo.SUBSCRIPTIONPAYMENTS
  ADD CONSTRAINT CK_SUBSCRIPTIONPAYMENTS_AMOUNT_POSITIVE CHECK (amount > 0);
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.check_constraints
  WHERE name = 'CK_SUBSCRIPTIONPAYMENTS_STATUS'
)
BEGIN
  ALTER TABLE dbo.SUBSCRIPTIONPAYMENTS
  ADD CONSTRAINT CK_SUBSCRIPTIONPAYMENTS_STATUS CHECK (status IN ('pending', 'paid', 'failed', 'refunded'));
END;
GO

/* UNIQUE constraint via unique index */
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'UX_SUBSCRIPTIONPAYMENTS_PAYMENT_REF' AND object_id = OBJECT_ID('dbo.SUBSCRIPTIONPAYMENTS')
)
BEGIN
  CREATE UNIQUE NONCLUSTERED INDEX UX_SUBSCRIPTIONPAYMENTS_PAYMENT_REF
    ON dbo.SUBSCRIPTIONPAYMENTS(payment_ref)
    WHERE payment_ref IS NOT NULL;
END;
GO

/* =============================
   2) Performance indexes
   ============================= */

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_USERACTIVITIES_USER_TIME' AND object_id = OBJECT_ID('dbo.USERACTIVITIES'))
BEGIN
  CREATE NONCLUSTERED INDEX IX_USERACTIVITIES_USER_TIME
  ON dbo.USERACTIVITIES(user_id, [timestamp] DESC);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_APPLIEDTUITIONS_TUITION_STATUS' AND object_id = OBJECT_ID('dbo.APPLIEDTUITIONS'))
BEGIN
  CREATE NONCLUSTERED INDEX IX_APPLIEDTUITIONS_TUITION_STATUS
  ON dbo.APPLIEDTUITIONS(tuition_id, status)
  INCLUDE (applied_at, user_id);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MARKETPLACELISTINGS_STATUS_PRICE' AND object_id = OBJECT_ID('dbo.MARKETPLACELISTINGS'))
BEGIN
  CREATE NONCLUSTERED INDEX IX_MARKETPLACELISTINGS_STATUS_PRICE
  ON dbo.MARKETPLACELISTINGS(status, price)
  INCLUDE (title, user_id, created_at);
END;
GO

/* =============================
   3) Views for frequent reads
   ============================= */

IF OBJECT_ID('dbo.vw_dashboard_stats', 'V') IS NOT NULL
  DROP VIEW dbo.vw_dashboard_stats;
GO

CREATE VIEW dbo.vw_dashboard_stats
AS
SELECT
  (SELECT COUNT(*) FROM dbo.BOOKEDTUITIONS)
  + (SELECT COUNT(*) FROM dbo.BOOKEDMAIDS)
  + (SELECT COUNT(*) FROM dbo.BOOKEDROOMMATES) AS total_bookings,
  (SELECT COUNT(*) FROM dbo.APPLIEDTUITIONS WHERE status = 'pending')
  + (SELECT COUNT(*) FROM dbo.APPLIEDMAIDS WHERE status = 'pending')
  + (SELECT COUNT(*) FROM dbo.APPLIEDROOMMATES WHERE status = 'pending') AS pending_applications,
  (SELECT ISNULL(SUM(amount), 0) FROM dbo.SUBSCRIPTIONPAYMENTS WHERE status = 'paid') AS total_paid_amount,
  (SELECT COUNT(*) FROM dbo.MARKETPLACELISTINGS WHERE status = 'available') AS active_marketplace_items;
GO

IF OBJECT_ID('dbo.vw_tuition_booking_details', 'V') IS NOT NULL
  DROP VIEW dbo.vw_tuition_booking_details;
GO

CREATE VIEW dbo.vw_tuition_booking_details
AS
SELECT
  b.booking_id,
  b.confirmed_at,
  t.tuition_id,
  t.subject,
  t.salary,
  t.location,
  u.user_id AS applicant_id,
  u.name AS applicant_name,
  u.email AS applicant_email
FROM dbo.BOOKEDTUITIONS b
INNER JOIN dbo.APPLIEDTUITIONS a ON a.application_id = b.application_id
INNER JOIN dbo.TUITIONS t ON t.tuition_id = a.tuition_id
INNER JOIN dbo.USERS u ON u.user_id = a.user_id;
GO

/* =============================
   4) Stored procedures
   ============================= */

IF OBJECT_ID('dbo.sp_process_subscription_payment', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_process_subscription_payment;
GO

CREATE PROCEDURE dbo.sp_process_subscription_payment
  @p_user_id UNIQUEIDENTIFIER,
  @p_amount DECIMAL(10,2),
  @p_payment_ref NVARCHAR(50) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    BEGIN TRANSACTION;

    IF @p_amount <= 0
      THROW 50001, 'Amount must be positive.', 1;

    DECLARE @new_payment_id UNIQUEIDENTIFIER;

    INSERT INTO dbo.SUBSCRIPTIONPAYMENTS (user_id, amount, status, payment_ref)
    VALUES (@p_user_id, @p_amount, 'paid', @p_payment_ref);

    SELECT TOP 1 @new_payment_id = payment_id
    FROM dbo.SUBSCRIPTIONPAYMENTS
    WHERE user_id = @p_user_id
    ORDER BY payment_date DESC;

    INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
    VALUES (@p_user_id, 'subscription_payment_processed', 'SUBSCRIPTIONPAYMENTS', @new_payment_id);

    COMMIT TRANSACTION;

    SELECT payment_id, user_id, amount, vat_amount, status, payment_date, payment_ref
    FROM dbo.SUBSCRIPTIONPAYMENTS
    WHERE payment_id = @new_payment_id;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

IF OBJECT_ID('dbo.sp_confirm_tuition_booking', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_confirm_tuition_booking;
GO

CREATE PROCEDURE dbo.sp_confirm_tuition_booking
  @p_application_id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @applicant_id UNIQUEIDENTIFIER;

    SELECT @applicant_id = user_id
    FROM dbo.APPLIEDTUITIONS
    WHERE application_id = @p_application_id;

    IF @applicant_id IS NULL
      THROW 50002, 'Tuition application not found.', 1;

    INSERT INTO dbo.BOOKEDTUITIONS (application_id)
    VALUES (@p_application_id);

    UPDATE dbo.APPLIEDTUITIONS
    SET status = 'booked'
    WHERE application_id = @p_application_id;

    INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
    VALUES (@applicant_id, 'book_tuition_via_proc', 'BOOKEDTUITIONS', @p_application_id);

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

/* =============================
   5) Trigger automation
   ============================= */

IF OBJECT_ID('dbo.trg_appliedtuitions_status_booked_activity', 'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_appliedtuitions_status_booked_activity;
GO

CREATE TRIGGER dbo.trg_appliedtuitions_status_booked_activity
ON dbo.APPLIEDTUITIONS
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
  SELECT i.user_id, 'tuition_status_changed_to_booked', 'APPLIEDTUITIONS', i.application_id
  FROM inserted i
  INNER JOIN deleted d ON d.application_id = i.application_id
  WHERE i.status = 'booked' AND d.status <> 'booked';
END;
GO

IF OBJECT_ID('dbo.trg_marketplace_sold_activity', 'TR') IS NOT NULL
  DROP TRIGGER dbo.trg_marketplace_sold_activity;
GO

CREATE TRIGGER dbo.trg_marketplace_sold_activity
ON dbo.MARKETPLACELISTINGS
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
  SELECT i.user_id, 'marketplace_item_sold', 'MARKETPLACELISTINGS', i.item_id
  FROM inserted i
  INNER JOIN deleted d ON d.item_id = i.item_id
  WHERE i.status = 'sold' AND d.status <> 'sold';
END;
GO

/* =============================
   6) Sample data (idempotent)
   ============================= */

IF NOT EXISTS (SELECT 1 FROM dbo.ANNOUNCEMENTS)
BEGIN
  INSERT INTO dbo.ANNOUNCEMENTS (title, message, created_by)
  SELECT TOP 1
    'Welcome to BacheLORE',
    'Platform initialized with SQL mastery support.',
    u.user_id
  FROM dbo.USERS u
  ORDER BY u.created_at ASC;
END;
GO

/* =============================
   7) SQL Feature Demonstrations
   ============================= */

/* INNER JOIN */
SELECT TOP 5 t.subject, u.name AS owner_name
FROM dbo.TUITIONS t
INNER JOIN dbo.USERS u ON u.user_id = t.user_id
ORDER BY t.created_at DESC;

/* LEFT JOIN */
SELECT TOP 5 h.house_id, h.location, c.contact_id
FROM dbo.HOUSERENTLISTINGS h
LEFT JOIN dbo.HOUSECONTACTS c ON c.house_id = h.house_id
ORDER BY h.created_at DESC;

/* RIGHT JOIN */
SELECT TOP 5 c.contact_id, c.house_id, h.location
FROM dbo.HOUSERENTLISTINGS h
RIGHT JOIN dbo.HOUSECONTACTS c ON c.house_id = h.house_id
ORDER BY c.created_at DESC;

/* FULL OUTER JOIN */
SELECT TOP 5 r.listing_id, a.application_id
FROM dbo.ROOMMATELISTINGS r
FULL OUTER JOIN dbo.APPLIEDROOMMATES a ON a.listing_id = r.listing_id;

/* Aggregates + GROUP BY + HAVING */
SELECT status, COUNT(*) AS payment_count, SUM(amount) AS total_amount, AVG(amount) AS avg_amount,
       MAX(amount) AS max_amount, MIN(amount) AS min_amount
FROM dbo.SUBSCRIPTIONPAYMENTS
GROUP BY status
HAVING COUNT(*) >= 1;

/* Non-correlated subquery */
SELECT tuition_id, subject, salary
FROM dbo.TUITIONS
WHERE salary > (SELECT AVG(salary) FROM dbo.TUITIONS);

/* Correlated subquery */
SELECT u.user_id, u.name
FROM dbo.USERS u
WHERE EXISTS (
  SELECT 1
  FROM dbo.APPLIEDTUITIONS a
  WHERE a.user_id = u.user_id
);

/* CROSS APPLY */
SELECT TOP 5 u.user_id, u.name, x.latest_action, x.latest_time
FROM dbo.USERS u
CROSS APPLY (
  SELECT TOP 1 ua.action_type AS latest_action, ua.[timestamp] AS latest_time
  FROM dbo.USERACTIVITIES ua
  WHERE ua.user_id = u.user_id
  ORDER BY ua.[timestamp] DESC
) x;

/* OUTER APPLY */
SELECT TOP 5 u.user_id, u.name, y.latest_payment_amount, y.latest_payment_date
FROM dbo.USERS u
OUTER APPLY (
  SELECT TOP 1 sp.amount AS latest_payment_amount, sp.payment_date AS latest_payment_date
  FROM dbo.SUBSCRIPTIONPAYMENTS sp
  WHERE sp.user_id = u.user_id
  ORDER BY sp.payment_date DESC
) y;
GO
