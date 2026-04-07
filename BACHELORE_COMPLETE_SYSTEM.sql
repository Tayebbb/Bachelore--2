/*
  BacheLORE Complete Database Script (MSSQL)
  Covers: DDL, Constraints, Seed Data, Views, Stored Procedures,
          Triggers, Transactions, Joins, Aggregates, Subqueries.
*/

IF DB_ID('BACHELORE') IS NULL
BEGIN
  CREATE DATABASE BACHELORE;
END;
GO

USE BACHELORE;
GO

/* =============================
   DROP OLD OBJECTS (SAFE ORDER)
   ============================= */
IF OBJECT_ID('dbo.trg_marketplace_status_activity', 'TR') IS NOT NULL DROP TRIGGER dbo.trg_marketplace_status_activity;
IF OBJECT_ID('dbo.trg_listing_insert_activity', 'TR') IS NOT NULL DROP TRIGGER dbo.trg_listing_insert_activity;
IF OBJECT_ID('dbo.trg_subscription_payment_activity', 'TR') IS NOT NULL DROP TRIGGER dbo.trg_subscription_payment_activity;
GO

IF OBJECT_ID('dbo.sp_admin_review_listing', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_admin_review_listing;
IF OBJECT_ID('dbo.sp_process_subscription_payment', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_process_subscription_payment;
IF OBJECT_ID('dbo.sp_confirm_booking_from_application', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_confirm_booking_from_application;
GO

IF OBJECT_ID('dbo.vw_admin_dashboard_summary', 'V') IS NOT NULL DROP VIEW dbo.vw_admin_dashboard_summary;
IF OBJECT_ID('dbo.vw_student_dashboard', 'V') IS NOT NULL DROP VIEW dbo.vw_student_dashboard;
IF OBJECT_ID('dbo.vw_application_monitor', 'V') IS NOT NULL DROP VIEW dbo.vw_application_monitor;
GO

IF OBJECT_ID('dbo.BOOKEDROOMMATES', 'U') IS NOT NULL DROP TABLE dbo.BOOKEDROOMMATES;
IF OBJECT_ID('dbo.BOOKEDMAIDS', 'U') IS NOT NULL DROP TABLE dbo.BOOKEDMAIDS;
IF OBJECT_ID('dbo.BOOKEDTUITIONS', 'U') IS NOT NULL DROP TABLE dbo.BOOKEDTUITIONS;
IF OBJECT_ID('dbo.APPLIEDROOMMATES', 'U') IS NOT NULL DROP TABLE dbo.APPLIEDROOMMATES;
IF OBJECT_ID('dbo.APPLIEDMAIDS', 'U') IS NOT NULL DROP TABLE dbo.APPLIEDMAIDS;
IF OBJECT_ID('dbo.APPLIEDTUITIONS', 'U') IS NOT NULL DROP TABLE dbo.APPLIEDTUITIONS;
IF OBJECT_ID('dbo.HOUSECONTACTS', 'U') IS NOT NULL DROP TABLE dbo.HOUSECONTACTS;
IF OBJECT_ID('dbo.MARKETPLACELISTINGS', 'U') IS NOT NULL DROP TABLE dbo.MARKETPLACELISTINGS;
IF OBJECT_ID('dbo.HOUSERENTLISTINGS', 'U') IS NOT NULL DROP TABLE dbo.HOUSERENTLISTINGS;
IF OBJECT_ID('dbo.ROOMMATELISTINGS', 'U') IS NOT NULL DROP TABLE dbo.ROOMMATELISTINGS;
IF OBJECT_ID('dbo.MAIDS', 'U') IS NOT NULL DROP TABLE dbo.MAIDS;
IF OBJECT_ID('dbo.TUITIONS', 'U') IS NOT NULL DROP TABLE dbo.TUITIONS;
IF OBJECT_ID('dbo.USERACTIVITIES', 'U') IS NOT NULL DROP TABLE dbo.USERACTIVITIES;
IF OBJECT_ID('dbo.SUBSCRIPTIONPAYMENTS', 'U') IS NOT NULL DROP TABLE dbo.SUBSCRIPTIONPAYMENTS;
IF OBJECT_ID('dbo.ANNOUNCEMENTS', 'U') IS NOT NULL DROP TABLE dbo.ANNOUNCEMENTS;
IF OBJECT_ID('dbo.USERS', 'U') IS NOT NULL DROP TABLE dbo.USERS;
GO

/* =============================
   TABLES + CONSTRAINTS (3NF)
   ============================= */
CREATE TABLE dbo.USERS (
  user_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(120) NOT NULL,
  email NVARCHAR(180) NOT NULL,
  password_hash NVARCHAR(255) NOT NULL,
  role NVARCHAR(20) NOT NULL,
  is_blocked BIT NOT NULL DEFAULT 0,
  block_reason NVARCHAR(300) NULL,
  subscription_active BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_USERS_EMAIL UNIQUE (email),
  CONSTRAINT CK_USERS_ROLE CHECK (role IN ('admin', 'student'))
);
GO

CREATE TABLE dbo.ANNOUNCEMENTS (
  announcement_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  title NVARCHAR(220) NOT NULL,
  message NVARCHAR(MAX) NOT NULL,
  created_by UNIQUEIDENTIFIER NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_ANNOUNCEMENTS_USERS FOREIGN KEY (created_by) REFERENCES dbo.USERS(user_id)
);
GO

CREATE TABLE dbo.SUBSCRIPTIONPAYMENTS (
  payment_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status NVARCHAR(30) NOT NULL,
  payment_ref NVARCHAR(50) NULL,
  payment_date DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  vat_amount AS CAST(amount * 0.15 AS DECIMAL(10,2)),
  CONSTRAINT FK_SUBSCRIPTIONPAYMENTS_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id),
  CONSTRAINT CK_SUBSCRIPTIONPAYMENTS_AMOUNT CHECK (amount > 0),
  CONSTRAINT CK_SUBSCRIPTIONPAYMENTS_STATUS CHECK (status IN ('pending', 'paid', 'failed', 'refunded'))
);
GO

CREATE TABLE dbo.USERACTIVITIES (
  activity_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL,
  action_type NVARCHAR(90) NOT NULL,
  reference_table NVARCHAR(80) NOT NULL,
  reference_id UNIQUEIDENTIFIER NULL,
  [timestamp] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_USERACTIVITIES_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id)
);
GO

CREATE TABLE dbo.TUITIONS (
  tuition_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL,
  subject NVARCHAR(160) NOT NULL,
  salary DECIMAL(10,2) NOT NULL,
  location NVARCHAR(180) NOT NULL,
  status NVARCHAR(30) NOT NULL DEFAULT 'Pending',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_TUITIONS_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id),
  CONSTRAINT CK_TUITIONS_STATUS CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Booked', 'open', 'closed'))
);
GO

CREATE TABLE dbo.MAIDS (
  maid_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL,
  salary DECIMAL(10,2) NOT NULL,
  location NVARCHAR(180) NOT NULL,
  availability NVARCHAR(60) NOT NULL,
  status NVARCHAR(30) NOT NULL DEFAULT 'Pending',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_MAIDS_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id),
  CONSTRAINT CK_MAIDS_STATUS CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Booked', 'open', 'closed'))
);
GO

CREATE TABLE dbo.ROOMMATELISTINGS (
  listing_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL,
  location NVARCHAR(180) NOT NULL,
  rent DECIMAL(10,2) NOT NULL,
  preference NVARCHAR(MAX) NULL,
  [type] NVARCHAR(20) NOT NULL,
  status NVARCHAR(30) NOT NULL DEFAULT 'Pending',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_ROOMMATES_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id),
  CONSTRAINT CK_ROOMMATES_TYPE CHECK ([type] IN ('host', 'seeker')),
  CONSTRAINT CK_ROOMMATES_STATUS CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Booked', 'open', 'closed'))
);
GO

CREATE TABLE dbo.HOUSERENTLISTINGS (
  house_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL,
  location NVARCHAR(180) NOT NULL,
  rent DECIMAL(10,2) NOT NULL,
  rooms INT NOT NULL,
  description NVARCHAR(MAX) NULL,
  status NVARCHAR(30) NOT NULL DEFAULT 'Pending',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_HOUSE_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id),
  CONSTRAINT CK_HOUSE_ROOMS CHECK (rooms > 0),
  CONSTRAINT CK_HOUSE_STATUS CHECK (status IN ('Pending', 'Approved', 'Rejected', 'open', 'closed'))
);
GO

CREATE TABLE dbo.MARKETPLACELISTINGS (
  item_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL,
  title NVARCHAR(180) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  [condition] NVARCHAR(40) NOT NULL,
  status NVARCHAR(30) NOT NULL DEFAULT 'Pending',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_MARKET_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id),
  CONSTRAINT CK_MARKET_STATUS CHECK (status IN ('Pending', 'Approved', 'Rejected', 'available', 'sold'))
);
GO

CREATE TABLE dbo.HOUSECONTACTS (
  contact_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  house_id UNIQUEIDENTIFIER NOT NULL,
  user_id UNIQUEIDENTIFIER NOT NULL,
  message NVARCHAR(MAX) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_HOUSECONTACTS_HOUSE FOREIGN KEY (house_id) REFERENCES dbo.HOUSERENTLISTINGS(house_id),
  CONSTRAINT FK_HOUSECONTACTS_USER FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id)
);
GO

CREATE TABLE dbo.APPLIEDTUITIONS (
  application_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  tuition_id UNIQUEIDENTIFIER NOT NULL,
  user_id UNIQUEIDENTIFIER NOT NULL,
  status NVARCHAR(30) NOT NULL DEFAULT 'pending',
  applied_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_AT_TUITIONS FOREIGN KEY (tuition_id) REFERENCES dbo.TUITIONS(tuition_id),
  CONSTRAINT FK_AT_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id),
  CONSTRAINT CK_AT_STATUS CHECK (status IN ('pending', 'approved', 'rejected', 'booked'))
);
GO

CREATE TABLE dbo.APPLIEDMAIDS (
  application_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  maid_id UNIQUEIDENTIFIER NOT NULL,
  user_id UNIQUEIDENTIFIER NOT NULL,
  status NVARCHAR(30) NOT NULL DEFAULT 'pending',
  applied_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_AM_MAIDS FOREIGN KEY (maid_id) REFERENCES dbo.MAIDS(maid_id),
  CONSTRAINT FK_AM_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id),
  CONSTRAINT CK_AM_STATUS CHECK (status IN ('pending', 'approved', 'rejected', 'booked'))
);
GO

CREATE TABLE dbo.APPLIEDROOMMATES (
  application_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  listing_id UNIQUEIDENTIFIER NOT NULL,
  user_id UNIQUEIDENTIFIER NOT NULL,
  status NVARCHAR(30) NOT NULL DEFAULT 'pending',
  applied_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_AR_LISTINGS FOREIGN KEY (listing_id) REFERENCES dbo.ROOMMATELISTINGS(listing_id),
  CONSTRAINT FK_AR_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id),
  CONSTRAINT CK_AR_STATUS CHECK (status IN ('pending', 'approved', 'rejected', 'booked'))
);
GO

CREATE TABLE dbo.BOOKEDTUITIONS (
  booking_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  application_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
  confirmed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_BT_APP FOREIGN KEY (application_id) REFERENCES dbo.APPLIEDTUITIONS(application_id)
);
GO

CREATE TABLE dbo.BOOKEDMAIDS (
  booking_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  application_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
  confirmed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_BM_APP FOREIGN KEY (application_id) REFERENCES dbo.APPLIEDMAIDS(application_id)
);
GO

CREATE TABLE dbo.BOOKEDROOMMATES (
  booking_id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  application_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
  confirmed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_BR_APP FOREIGN KEY (application_id) REFERENCES dbo.APPLIEDROOMMATES(application_id)
);
GO

/* =============================
   INDEXES
   ============================= */
CREATE INDEX IX_USERACTIVITY_USER_TIME ON dbo.USERACTIVITIES(user_id, [timestamp] DESC);
CREATE INDEX IX_PAYMENTS_USER_STATUS ON dbo.SUBSCRIPTIONPAYMENTS(user_id, status, payment_date DESC);
CREATE INDEX IX_LISTINGS_STATUS ON dbo.TUITIONS(status, created_at DESC);
CREATE INDEX IX_MARKET_STATUS_PRICE ON dbo.MARKETPLACELISTINGS(status, price);
GO

/* =============================
   SEED DATA
   ============================= */
DECLARE @adminId UNIQUEIDENTIFIER = NEWID();
DECLARE @studentA UNIQUEIDENTIFIER = NEWID();
DECLARE @studentB UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.USERS (user_id, name, email, password_hash, role, subscription_active)
VALUES
(@adminId, 'System Admin', 'admin@bachelore.local', 'hashed_admin', 'admin', 1),
(@studentA, 'Student One', 'student1@aust.edu', 'hashed_student_1', 'student', 1),
(@studentB, 'Student Two', 'student2@aust.edu', 'hashed_student_2', 'student', 0);

INSERT INTO dbo.ANNOUNCEMENTS (title, message, created_by)
VALUES ('Welcome', 'Welcome to BacheLORE platform.', @adminId);

INSERT INTO dbo.TUITIONS (user_id, subject, salary, location, status)
VALUES
(@studentA, 'Physics', 6500, 'Dhaka', 'Pending'),
(@studentB, 'Math', 7000, 'Dhaka', 'Approved');

INSERT INTO dbo.MAIDS (user_id, salary, location, availability, status)
VALUES (@studentA, 4500, 'Banani', 'Full Time', 'Pending');

INSERT INTO dbo.ROOMMATELISTINGS (user_id, location, rent, preference, [type], status)
VALUES (@studentA, 'Mirpur', 5000, 'Non-smoker', 'host', 'Approved');

INSERT INTO dbo.HOUSERENTLISTINGS (user_id, location, rent, rooms, description, status)
VALUES (@studentB, 'Uttara', 15000, 2, 'Near bus stop', 'Approved');

INSERT INTO dbo.MARKETPLACELISTINGS (user_id, title, price, [condition], status)
VALUES
(@studentA, 'Study Table', 3000, 'good', 'Pending'),
(@studentB, 'Chair', 1200, 'used', 'available');
GO

/* =============================
   VIEWS
   ============================= */
CREATE VIEW dbo.vw_admin_dashboard_summary
AS
SELECT
  (SELECT COUNT(*) FROM dbo.USERS) AS total_users,
  (SELECT COUNT(*) FROM dbo.TUITIONS)
  + (SELECT COUNT(*) FROM dbo.MAIDS)
  + (SELECT COUNT(*) FROM dbo.ROOMMATELISTINGS)
  + (SELECT COUNT(*) FROM dbo.HOUSERENTLISTINGS)
  + (SELECT COUNT(*) FROM dbo.MARKETPLACELISTINGS) AS total_listings,
  (SELECT COUNT(*) FROM dbo.BOOKEDTUITIONS)
  + (SELECT COUNT(*) FROM dbo.BOOKEDMAIDS)
  + (SELECT COUNT(*) FROM dbo.BOOKEDROOMMATES) AS total_bookings,
  (SELECT ISNULL(SUM(amount), 0) FROM dbo.SUBSCRIPTIONPAYMENTS WHERE status = 'paid') AS total_revenue,
  (SELECT COUNT(*) FROM dbo.APPLIEDTUITIONS WHERE status = 'pending')
  + (SELECT COUNT(*) FROM dbo.APPLIEDMAIDS WHERE status = 'pending')
  + (SELECT COUNT(*) FROM dbo.APPLIEDROOMMATES WHERE status = 'pending') AS pending_applications;
GO

CREATE VIEW dbo.vw_student_dashboard
AS
SELECT
  u.user_id,
  (
    (SELECT COUNT(*) FROM dbo.APPLIEDTUITIONS atq WHERE atq.user_id = u.user_id)
    + (SELECT COUNT(*) FROM dbo.APPLIEDMAIDS am WHERE am.user_id = u.user_id)
    + (SELECT COUNT(*) FROM dbo.APPLIEDROOMMATES ar WHERE ar.user_id = u.user_id)
  ) AS total_applications,
  (
    (SELECT COUNT(*) FROM dbo.BOOKEDTUITIONS bt INNER JOIN dbo.APPLIEDTUITIONS atq ON atq.application_id = bt.application_id WHERE atq.user_id = u.user_id)
    + (SELECT COUNT(*) FROM dbo.BOOKEDMAIDS bm INNER JOIN dbo.APPLIEDMAIDS am ON am.application_id = bm.application_id WHERE am.user_id = u.user_id)
    + (SELECT COUNT(*) FROM dbo.BOOKEDROOMMATES br INNER JOIN dbo.APPLIEDROOMMATES ar ON ar.application_id = br.application_id WHERE ar.user_id = u.user_id)
  ) AS total_bookings,
  (
    (SELECT COUNT(*) FROM dbo.TUITIONS t WHERE t.user_id = u.user_id)
    + (SELECT COUNT(*) FROM dbo.MAIDS m WHERE m.user_id = u.user_id)
    + (SELECT COUNT(*) FROM dbo.ROOMMATELISTINGS r WHERE r.user_id = u.user_id)
    + (SELECT COUNT(*) FROM dbo.HOUSERENTLISTINGS h WHERE h.user_id = u.user_id)
    + (SELECT COUNT(*) FROM dbo.MARKETPLACELISTINGS mp WHERE mp.user_id = u.user_id)
  ) AS total_listings,
  (SELECT ISNULL(SUM(sp.amount), 0) FROM dbo.SUBSCRIPTIONPAYMENTS sp WHERE sp.user_id = u.user_id AND sp.status = 'paid') AS total_payments
FROM dbo.USERS u;
GO

CREATE VIEW dbo.vw_application_monitor
AS
SELECT 'tuition' AS module, a.application_id, a.user_id, a.status, a.applied_at, t.subject AS listing_title
FROM dbo.APPLIEDTUITIONS a
INNER JOIN dbo.TUITIONS t ON t.tuition_id = a.tuition_id
UNION ALL
SELECT 'maid' AS module, a.application_id, a.user_id, a.status, a.applied_at, CONCAT('Maid-', m.location)
FROM dbo.APPLIEDMAIDS a
INNER JOIN dbo.MAIDS m ON m.maid_id = a.maid_id
UNION ALL
SELECT 'roommate' AS module, a.application_id, a.user_id, a.status, a.applied_at, CONCAT('Roommate-', r.location)
FROM dbo.APPLIEDROOMMATES a
INNER JOIN dbo.ROOMMATELISTINGS r ON r.listing_id = a.listing_id;
GO

/* =============================
   STORED PROCEDURES + TRANSACTIONS
   ============================= */
CREATE PROCEDURE dbo.sp_admin_review_listing
  @listing_type NVARCHAR(40),
  @listing_id UNIQUEIDENTIFIER,
  @decision NVARCHAR(40),
  @admin_user_id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE @next_status NVARCHAR(30) = CASE WHEN LOWER(@decision) = 'approved' THEN 'Approved' ELSE 'Rejected' END;

  BEGIN TRY
    BEGIN TRANSACTION;

    IF LOWER(@listing_type) = 'tuition'
      UPDATE dbo.TUITIONS SET status = @next_status WHERE tuition_id = @listing_id;
    ELSE IF LOWER(@listing_type) = 'maid'
      UPDATE dbo.MAIDS SET status = @next_status WHERE maid_id = @listing_id;
    ELSE IF LOWER(@listing_type) = 'roommate'
      UPDATE dbo.ROOMMATELISTINGS SET status = @next_status WHERE listing_id = @listing_id;
    ELSE IF LOWER(@listing_type) = 'houserent'
      UPDATE dbo.HOUSERENTLISTINGS SET status = @next_status WHERE house_id = @listing_id;
    ELSE IF LOWER(@listing_type) = 'marketplace'
      UPDATE dbo.MARKETPLACELISTINGS SET status = @next_status WHERE item_id = @listing_id;
    ELSE
      THROW 50020, 'Unsupported listing type', 1;

    INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
    VALUES (@admin_user_id, CONCAT('admin_review_', LOWER(@listing_type), '_', LOWER(@decision)), 'LISTING', @listing_id);

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
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

    IF @p_amount <= 0 THROW 50021, 'Amount must be positive', 1;

    DECLARE @pid UNIQUEIDENTIFIER;

    INSERT INTO dbo.SUBSCRIPTIONPAYMENTS (user_id, amount, status, payment_ref)
    VALUES (@p_user_id, @p_amount, 'paid', @p_payment_ref);

    SELECT TOP 1 @pid = payment_id
    FROM dbo.SUBSCRIPTIONPAYMENTS
    WHERE user_id = @p_user_id
    ORDER BY payment_date DESC;

    UPDATE dbo.USERS
    SET subscription_active = 1
    WHERE user_id = @p_user_id;

    INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
    VALUES (@p_user_id, 'subscription_paid', 'SUBSCRIPTIONPAYMENTS', @pid);

    COMMIT TRANSACTION;

    SELECT * FROM dbo.SUBSCRIPTIONPAYMENTS WHERE payment_id = @pid;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

CREATE PROCEDURE dbo.sp_confirm_booking_from_application
  @p_module NVARCHAR(20),
  @p_application_id UNIQUEIDENTIFIER,
  @p_admin_user_id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    BEGIN TRANSACTION;

    IF LOWER(@p_module) = 'tuition'
    BEGIN
      INSERT INTO dbo.BOOKEDTUITIONS (application_id) VALUES (@p_application_id);
      UPDATE dbo.APPLIEDTUITIONS SET status = 'booked' WHERE application_id = @p_application_id;
    END
    ELSE IF LOWER(@p_module) = 'maid'
    BEGIN
      INSERT INTO dbo.BOOKEDMAIDS (application_id) VALUES (@p_application_id);
      UPDATE dbo.APPLIEDMAIDS SET status = 'booked' WHERE application_id = @p_application_id;
    END
    ELSE IF LOWER(@p_module) = 'roommate'
    BEGIN
      INSERT INTO dbo.BOOKEDROOMMATES (application_id) VALUES (@p_application_id);
      UPDATE dbo.APPLIEDROOMMATES SET status = 'booked' WHERE application_id = @p_application_id;
    END
    ELSE
      THROW 50022, 'Unsupported module', 1;

    INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
    VALUES (@p_admin_user_id, CONCAT('confirm_booking_', LOWER(@p_module)), 'BOOKINGS', @p_application_id);

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
GO

/* =============================
   TRIGGERS
   ============================= */
CREATE TRIGGER dbo.trg_subscription_payment_activity
ON dbo.SUBSCRIPTIONPAYMENTS
AFTER INSERT
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
  SELECT i.user_id, 'payment_inserted', 'SUBSCRIPTIONPAYMENTS', i.payment_id
  FROM inserted i;
END;
GO

CREATE TRIGGER dbo.trg_listing_insert_activity
ON dbo.TUITIONS
AFTER INSERT
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
  SELECT i.user_id, 'create_tuition', 'TUITIONS', i.tuition_id
  FROM inserted i;
END;
GO

CREATE TRIGGER dbo.trg_marketplace_status_activity
ON dbo.MARKETPLACELISTINGS
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
  SELECT i.user_id, 'marketplace_status_changed', 'MARKETPLACELISTINGS', i.item_id
  FROM inserted i
  INNER JOIN deleted d ON d.item_id = i.item_id
  WHERE ISNULL(i.status, '') <> ISNULL(d.status, '');
END;
GO

/* =============================
   COMPLEX QUERIES (FOR DEMO)
   ============================= */
-- INNER JOIN + aggregate
SELECT t.subject, COUNT(*) AS total_applicants, AVG(t.salary) AS avg_salary
FROM dbo.TUITIONS t
INNER JOIN dbo.APPLIEDTUITIONS a ON a.tuition_id = t.tuition_id
GROUP BY t.subject;

-- LEFT JOIN
SELECT h.house_id, h.location, c.contact_id, c.message
FROM dbo.HOUSERENTLISTINGS h
LEFT JOIN dbo.HOUSECONTACTS c ON c.house_id = h.house_id;

-- RIGHT JOIN
SELECT c.contact_id, c.message, h.location
FROM dbo.HOUSERENTLISTINGS h
RIGHT JOIN dbo.HOUSECONTACTS c ON c.house_id = h.house_id;

-- Subquery with AVG
SELECT tuition_id, subject, salary
FROM dbo.TUITIONS
WHERE salary > (SELECT AVG(salary) FROM dbo.TUITIONS);

-- Correlated subquery
SELECT u.user_id, u.name
FROM dbo.USERS u
WHERE EXISTS (
  SELECT 1
  FROM dbo.SUBSCRIPTIONPAYMENTS sp
  WHERE sp.user_id = u.user_id AND sp.status = 'paid'
);

-- Group by + Having
SELECT role, COUNT(*) AS users_per_role
FROM dbo.USERS
GROUP BY role
HAVING COUNT(*) >= 1;

-- Apply operators
SELECT TOP 10 u.user_id, u.name, x.latest_action, x.latest_time
FROM dbo.USERS u
OUTER APPLY (
  SELECT TOP 1 ua.action_type AS latest_action, ua.[timestamp] AS latest_time
  FROM dbo.USERACTIVITIES ua
  WHERE ua.user_id = u.user_id
  ORDER BY ua.[timestamp] DESC
) x;
GO

/* =============================
   SAMPLE TRANSACTION DEMO
   ============================= */
BEGIN TRY
  BEGIN TRANSACTION;

  DECLARE @demoUser UNIQUEIDENTIFIER;
  SELECT TOP 1 @demoUser = user_id FROM dbo.USERS WHERE role = 'student' ORDER BY created_at ASC;

  EXEC dbo.sp_process_subscription_payment @p_user_id = @demoUser, @p_amount = 99.00, @p_payment_ref = 'DEMO-TX-001';

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
GO

/* =============================
   ADVANCED UPGRADE PACK
   ============================= */
IF COL_LENGTH('dbo.USERACTIVITIES', 'activity_description') IS NULL
BEGIN
  ALTER TABLE dbo.USERACTIVITIES ADD activity_description NVARCHAR(300) NULL;
END;
GO

CREATE OR ALTER VIEW dbo.vw_admin_dashboard_summary
AS
WITH payment_agg AS (
  SELECT
    ISNULL(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue,
    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_payment_count,
    CAST(AVG(CASE WHEN status = 'paid' THEN amount END) AS DECIMAL(10,2)) AS avg_payment_value,
    ISNULL(SUM(CASE WHEN status = 'paid' AND payment_date >= DATEFROMPARTS(YEAR(GETUTCDATE()), MONTH(GETUTCDATE()), 1) THEN amount ELSE 0 END), 0) AS current_month_revenue
  FROM dbo.SUBSCRIPTIONPAYMENTS
),
activity_agg AS (
  SELECT
    COUNT(DISTINCT CASE WHEN [timestamp] >= DATEADD(DAY, -7, GETUTCDATE()) THEN user_id END) AS active_users_7d,
    COUNT(DISTINCT CASE WHEN [timestamp] >= DATEADD(DAY, -30, GETUTCDATE()) THEN user_id END) AS active_users_30d
  FROM dbo.USERACTIVITIES
)
SELECT
  (SELECT COUNT(*) FROM dbo.USERS) AS total_users,
  (SELECT COUNT(*) FROM dbo.USERS WHERE role = 'student') AS total_students,
  (SELECT COUNT(*) FROM dbo.USERS WHERE role = 'admin') AS total_admins,
  (SELECT COUNT(*) FROM dbo.TUITIONS)
  + (SELECT COUNT(*) FROM dbo.MAIDS)
  + (SELECT COUNT(*) FROM dbo.ROOMMATELISTINGS)
  + (SELECT COUNT(*) FROM dbo.HOUSERENTLISTINGS)
  + (SELECT COUNT(*) FROM dbo.MARKETPLACELISTINGS) AS total_listings,
  (SELECT COUNT(*) FROM dbo.BOOKEDTUITIONS)
  + (SELECT COUNT(*) FROM dbo.BOOKEDMAIDS)
  + (SELECT COUNT(*) FROM dbo.BOOKEDROOMMATES) AS total_bookings,
  (SELECT COUNT(*) FROM dbo.APPLIEDTUITIONS WHERE status = 'pending')
  + (SELECT COUNT(*) FROM dbo.APPLIEDMAIDS WHERE status = 'pending')
  + (SELECT COUNT(*) FROM dbo.APPLIEDROOMMATES WHERE status = 'pending') AS pending_applications,
  (SELECT COUNT(*) FROM dbo.TUITIONS WHERE status = 'Pending')
  + (SELECT COUNT(*) FROM dbo.MAIDS WHERE status = 'Pending')
  + (SELECT COUNT(*) FROM dbo.ROOMMATELISTINGS WHERE status = 'Pending')
  + (SELECT COUNT(*) FROM dbo.HOUSERENTLISTINGS WHERE status = 'Pending')
  + (SELECT COUNT(*) FROM dbo.MARKETPLACELISTINGS WHERE status = 'Pending') AS pending_listing_reviews,
  p.total_revenue,
  p.paid_payment_count,
  ISNULL(p.avg_payment_value, 0) AS avg_payment_value,
  p.current_month_revenue,
  a.active_users_7d,
  a.active_users_30d
FROM payment_agg p
CROSS JOIN activity_agg a;
GO

CREATE OR ALTER VIEW dbo.vw_student_dashboard
AS
SELECT
  u.user_id,
  (SELECT COUNT(*) FROM dbo.APPLIEDTUITIONS atq WHERE atq.user_id = u.user_id)
  + (SELECT COUNT(*) FROM dbo.APPLIEDMAIDS am WHERE am.user_id = u.user_id)
  + (SELECT COUNT(*) FROM dbo.APPLIEDROOMMATES ar WHERE ar.user_id = u.user_id) AS total_applications,
  (SELECT COUNT(*) FROM dbo.BOOKEDTUITIONS bt INNER JOIN dbo.APPLIEDTUITIONS atq ON atq.application_id = bt.application_id WHERE atq.user_id = u.user_id)
  + (SELECT COUNT(*) FROM dbo.BOOKEDMAIDS bm INNER JOIN dbo.APPLIEDMAIDS am ON am.application_id = bm.application_id WHERE am.user_id = u.user_id)
  + (SELECT COUNT(*) FROM dbo.BOOKEDROOMMATES br INNER JOIN dbo.APPLIEDROOMMATES ar ON ar.application_id = br.application_id WHERE ar.user_id = u.user_id) AS total_bookings,
  (SELECT COUNT(*) FROM dbo.TUITIONS t WHERE t.user_id = u.user_id)
  + (SELECT COUNT(*) FROM dbo.MAIDS m WHERE m.user_id = u.user_id)
  + (SELECT COUNT(*) FROM dbo.ROOMMATELISTINGS r WHERE r.user_id = u.user_id)
  + (SELECT COUNT(*) FROM dbo.HOUSERENTLISTINGS h WHERE h.user_id = u.user_id)
  + (SELECT COUNT(*) FROM dbo.MARKETPLACELISTINGS mp WHERE mp.user_id = u.user_id) AS total_listings,
  (SELECT ISNULL(SUM(sp.amount), 0) FROM dbo.SUBSCRIPTIONPAYMENTS sp WHERE sp.user_id = u.user_id AND sp.status = 'paid') AS total_payments,
  (SELECT COUNT(*) FROM dbo.APPLIEDTUITIONS a WHERE a.user_id = u.user_id AND a.status = 'pending')
  + (SELECT COUNT(*) FROM dbo.APPLIEDMAIDS a WHERE a.user_id = u.user_id AND a.status = 'pending')
  + (SELECT COUNT(*) FROM dbo.APPLIEDROOMMATES a WHERE a.user_id = u.user_id AND a.status = 'pending') AS pending_applications,
  (SELECT COUNT(*) FROM dbo.USERACTIVITIES ua WHERE ua.user_id = u.user_id AND ua.[timestamp] >= DATEADD(DAY, -30, GETUTCDATE())) AS activity_count_30d,
  (SELECT MAX(ua.[timestamp]) FROM dbo.USERACTIVITIES ua WHERE ua.user_id = u.user_id) AS last_activity_at,
  (SELECT ISNULL(SUM(sp.amount), 0) FROM dbo.SUBSCRIPTIONPAYMENTS sp WHERE sp.user_id = u.user_id AND sp.status = 'paid' AND sp.payment_date >= DATEFROMPARTS(YEAR(GETUTCDATE()), MONTH(GETUTCDATE()), 1)) AS current_month_spend
FROM dbo.USERS u
WHERE u.role = 'student';
GO

CREATE OR ALTER PROCEDURE dbo.sp_student_subscription_payment
  @p_user_id UNIQUEIDENTIFIER,
  @p_amount DECIMAL(10,2),
  @p_payment_ref NVARCHAR(50) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE @new_payment_id UNIQUEIDENTIFIER;

  BEGIN TRY
    BEGIN TRANSACTION;

    IF @p_amount <= 0
      THROW 50021, 'Payment amount must be positive', 1;

    INSERT INTO dbo.SUBSCRIPTIONPAYMENTS (user_id, amount, status, payment_ref)
    VALUES (@p_user_id, @p_amount, 'pending', @p_payment_ref);

    SELECT TOP 1 @new_payment_id = payment_id
    FROM dbo.SUBSCRIPTIONPAYMENTS
    WHERE user_id = @p_user_id
    ORDER BY payment_date DESC;

    UPDATE dbo.SUBSCRIPTIONPAYMENTS SET status = 'paid' WHERE payment_id = @new_payment_id;
    UPDATE dbo.USERS SET subscription_active = 1 WHERE user_id = @p_user_id;

    INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
    VALUES (@p_user_id, 'subscription_paid', 'SUBSCRIPTIONPAYMENTS', @new_payment_id, 'Subscription payment completed and activated');

    COMMIT TRANSACTION;

    SELECT CAST(0 AS INT) AS status_code, 'payment_processed' AS status_message, @new_payment_id AS payment_id;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT CAST(ERROR_NUMBER() AS INT) AS status_code, ERROR_MESSAGE() AS status_message, CAST(NULL AS UNIQUEIDENTIFIER) AS payment_id;
  END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_submit_tuition_application
  @p_user_id UNIQUEIDENTIFIER,
  @p_tuition_id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE @application_id UNIQUEIDENTIFIER;
  DECLARE @owner_id UNIQUEIDENTIFIER;

  BEGIN TRY
    BEGIN TRANSACTION;

    SELECT @owner_id = t.user_id
    FROM dbo.TUITIONS t
    WHERE t.tuition_id = @p_tuition_id
      AND t.status IN ('Approved', 'approved', 'open');

    IF @owner_id IS NULL THROW 50031, 'Tuition is not available for application', 1;
    IF @owner_id = @p_user_id THROW 50032, 'You cannot apply to your own tuition listing', 1;

    IF EXISTS (
      SELECT 1
      FROM dbo.APPLIEDTUITIONS a
      WHERE a.user_id = @p_user_id
        AND a.tuition_id = @p_tuition_id
        AND a.status IN ('pending', 'approved', 'booked')
    )
      THROW 50033, 'Duplicate active tuition application is not allowed', 1;

    INSERT INTO dbo.APPLIEDTUITIONS (tuition_id, user_id, status)
    VALUES (@p_tuition_id, @p_user_id, 'pending');

    SELECT TOP 1 @application_id = application_id
    FROM dbo.APPLIEDTUITIONS
    WHERE user_id = @p_user_id AND tuition_id = @p_tuition_id
    ORDER BY applied_at DESC;

    INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
    VALUES
      (@p_user_id, 'apply_tuition', 'APPLIEDTUITIONS', @application_id, 'Student submitted tuition application'),
      (@owner_id, 'tuition_received_application', 'APPLIEDTUITIONS', @application_id, 'A new tuition application was received');

    COMMIT TRANSACTION;

    SELECT CAST(0 AS INT) AS status_code, 'application_submitted' AS status_message, @application_id AS application_id;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT CAST(ERROR_NUMBER() AS INT) AS status_code, ERROR_MESSAGE() AS status_message, CAST(NULL AS UNIQUEIDENTIFIER) AS application_id;
  END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_process_maid_booking
  @p_application_id UNIQUEIDENTIFIER,
  @p_actor_user_id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE @maid_id UNIQUEIDENTIFIER;
  DECLARE @student_id UNIQUEIDENTIFIER;
  DECLARE @booking_id UNIQUEIDENTIFIER;

  BEGIN TRY
    BEGIN TRANSACTION;

    SELECT @maid_id = a.maid_id, @student_id = a.user_id
    FROM dbo.APPLIEDMAIDS a
    WHERE a.application_id = @p_application_id;

    IF @maid_id IS NULL THROW 50041, 'Maid application not found', 1;
    IF EXISTS (SELECT 1 FROM dbo.BOOKEDMAIDS WHERE application_id = @p_application_id)
      THROW 50042, 'Booking already exists for this maid application', 1;

    INSERT INTO dbo.BOOKEDMAIDS (application_id) VALUES (@p_application_id);
    SELECT TOP 1 @booking_id = booking_id FROM dbo.BOOKEDMAIDS WHERE application_id = @p_application_id;

    UPDATE dbo.APPLIEDMAIDS SET status = 'booked' WHERE application_id = @p_application_id;
    UPDATE dbo.MAIDS SET status = 'Booked' WHERE maid_id = @maid_id;

    INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
    VALUES
      (@student_id, 'maid_booking_confirmed', 'BOOKEDMAIDS', @booking_id, 'Maid booking confirmed'),
      (@p_actor_user_id, 'maid_booking_processed', 'BOOKEDMAIDS', @booking_id, 'Booking processed through stored procedure');

    COMMIT TRANSACTION;

    SELECT CAST(0 AS INT) AS status_code, 'maid_booking_confirmed' AS status_message, @booking_id AS booking_id;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT CAST(ERROR_NUMBER() AS INT) AS status_code, ERROR_MESSAGE() AS status_message, CAST(NULL AS UNIQUEIDENTIFIER) AS booking_id;
  END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_process_roommate_booking
  @p_application_id UNIQUEIDENTIFIER,
  @p_actor_user_id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE @listing_id UNIQUEIDENTIFIER;
  DECLARE @student_id UNIQUEIDENTIFIER;
  DECLARE @booking_id UNIQUEIDENTIFIER;

  BEGIN TRY
    BEGIN TRANSACTION;

    SELECT @listing_id = a.listing_id, @student_id = a.user_id
    FROM dbo.APPLIEDROOMMATES a
    WHERE a.application_id = @p_application_id;

    IF @listing_id IS NULL THROW 50051, 'Roommate application not found', 1;
    IF EXISTS (SELECT 1 FROM dbo.BOOKEDROOMMATES WHERE application_id = @p_application_id)
      THROW 50052, 'Booking already exists for this roommate application', 1;

    INSERT INTO dbo.BOOKEDROOMMATES (application_id) VALUES (@p_application_id);
    SELECT TOP 1 @booking_id = booking_id FROM dbo.BOOKEDROOMMATES WHERE application_id = @p_application_id;

    UPDATE dbo.APPLIEDROOMMATES SET status = 'booked' WHERE application_id = @p_application_id;
    UPDATE dbo.ROOMMATELISTINGS SET status = 'Booked' WHERE listing_id = @listing_id;

    INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
    VALUES
      (@student_id, 'roommate_booking_confirmed', 'BOOKEDROOMMATES', @booking_id, 'Roommate booking confirmed'),
      (@p_actor_user_id, 'roommate_booking_processed', 'BOOKEDROOMMATES', @booking_id, 'Booking processed through stored procedure');

    COMMIT TRANSACTION;

    SELECT CAST(0 AS INT) AS status_code, 'roommate_booking_confirmed' AS status_message, @booking_id AS booking_id;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT CAST(ERROR_NUMBER() AS INT) AS status_code, ERROR_MESSAGE() AS status_message, CAST(NULL AS UNIQUEIDENTIFIER) AS booking_id;
  END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_marketplace_purchase_transaction
  @p_item_id UNIQUEIDENTIFIER,
  @p_buyer_user_id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE @seller_user_id UNIQUEIDENTIFIER;

  BEGIN TRY
    BEGIN TRANSACTION;

    SELECT @seller_user_id = m.user_id
    FROM dbo.MARKETPLACELISTINGS m
    WHERE m.item_id = @p_item_id
      AND m.status IN ('available', 'Approved', 'approved');

    IF @seller_user_id IS NULL THROW 50061, 'Marketplace item is not available', 1;
    IF @seller_user_id = @p_buyer_user_id THROW 50062, 'You cannot purchase your own item', 1;

    UPDATE dbo.MARKETPLACELISTINGS SET status = 'sold' WHERE item_id = @p_item_id;

    INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
    VALUES
      (@p_buyer_user_id, 'marketplace_purchase', 'MARKETPLACELISTINGS', @p_item_id, 'Student purchased marketplace item'),
      (@seller_user_id, 'marketplace_item_sold', 'MARKETPLACELISTINGS', @p_item_id, 'Your marketplace item was sold');

    COMMIT TRANSACTION;

    SELECT CAST(0 AS INT) AS status_code, 'marketplace_purchase_completed' AS status_message, @p_item_id AS item_id;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT CAST(ERROR_NUMBER() AS INT) AS status_code, ERROR_MESSAGE() AS status_message, CAST(NULL AS UNIQUEIDENTIFIER) AS item_id;
  END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_admin_review_listing
  @listing_type NVARCHAR(40),
  @listing_id UNIQUEIDENTIFIER,
  @decision NVARCHAR(40),
  @admin_user_id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE @status NVARCHAR(30) = CASE WHEN LOWER(@decision) = 'approved' THEN 'Approved' ELSE 'Rejected' END;
  DECLARE @target_user_id UNIQUEIDENTIFIER = NULL;
  DECLARE @rows INT = 0;
  CREATE TABLE #tmp_owner (user_id UNIQUEIDENTIFIER);

  BEGIN TRY
    BEGIN TRANSACTION;

    IF LOWER(@listing_type) = 'tuition'
    BEGIN
      UPDATE dbo.TUITIONS
      SET status = @status
      OUTPUT INSERTED.user_id INTO #tmp_owner(user_id)
      WHERE tuition_id = @listing_id;
      SET @rows = @@ROWCOUNT;
    END
    ELSE IF LOWER(@listing_type) = 'maid'
    BEGIN
      UPDATE dbo.MAIDS
      SET status = @status
      OUTPUT INSERTED.user_id INTO #tmp_owner(user_id)
      WHERE maid_id = @listing_id;
      SET @rows = @@ROWCOUNT;
    END
    ELSE IF LOWER(@listing_type) = 'roommate'
    BEGIN
      UPDATE dbo.ROOMMATELISTINGS
      SET status = @status
      OUTPUT INSERTED.user_id INTO #tmp_owner(user_id)
      WHERE listing_id = @listing_id;
      SET @rows = @@ROWCOUNT;
    END
    ELSE IF LOWER(@listing_type) = 'houserent'
    BEGIN
      UPDATE dbo.HOUSERENTLISTINGS
      SET status = @status
      OUTPUT INSERTED.user_id INTO #tmp_owner(user_id)
      WHERE house_id = @listing_id;
      SET @rows = @@ROWCOUNT;
    END
    ELSE IF LOWER(@listing_type) = 'marketplace'
    BEGIN
      UPDATE dbo.MARKETPLACELISTINGS
      SET status = @status
      OUTPUT INSERTED.user_id INTO #tmp_owner(user_id)
      WHERE item_id = @listing_id;
      SET @rows = @@ROWCOUNT;
    END
    ELSE
      THROW 50010, 'Unsupported listing type', 1;

    SELECT TOP 1 @target_user_id = user_id FROM #tmp_owner;
    IF @rows = 0 THROW 50011, 'Listing not found', 1;

    INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
    VALUES
      (@admin_user_id, CONCAT('admin_review_', LOWER(@listing_type), '_', LOWER(@decision)), 'LISTING_REVIEW', @listing_id, CONCAT('Admin decision: ', @status)),
      (@target_user_id, CONCAT('listing_', LOWER(@decision)), UPPER(@listing_type), @listing_id, CONCAT('Your listing was ', @status));

    COMMIT TRANSACTION;

    SELECT CAST(0 AS INT) AS status_code, 'review_completed' AS status_message, @listing_type AS listing_type, @listing_id AS listing_id, @status AS updated_status;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT CAST(ERROR_NUMBER() AS INT) AS status_code, ERROR_MESSAGE() AS status_message;
  END CATCH
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_tuitions_status_update
ON dbo.TUITIONS
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
  SELECT i.user_id, 'listing_status_changed', 'TUITIONS', i.tuition_id, CONCAT('Status changed from ', d.status, ' to ', i.status)
  FROM inserted i
  INNER JOIN deleted d ON d.tuition_id = i.tuition_id
  WHERE d.status = 'Pending' AND i.status IN ('Approved', 'Rejected');
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_maids_status_update
ON dbo.MAIDS
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
  SELECT i.user_id, 'listing_status_changed', 'MAIDS', i.maid_id, CONCAT('Status changed from ', d.status, ' to ', i.status)
  FROM inserted i
  INNER JOIN deleted d ON d.maid_id = i.maid_id
  WHERE d.status = 'Pending' AND i.status IN ('Approved', 'Rejected');
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_roommates_status_update
ON dbo.ROOMMATELISTINGS
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
  SELECT i.user_id, 'listing_status_changed', 'ROOMMATELISTINGS', i.listing_id, CONCAT('Status changed from ', d.status, ' to ', i.status)
  FROM inserted i
  INNER JOIN deleted d ON d.listing_id = i.listing_id
  WHERE d.status = 'Pending' AND i.status IN ('Approved', 'Rejected');
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_marketplace_status_update
ON dbo.MARKETPLACELISTINGS
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
  SELECT i.user_id, 'listing_status_changed', 'MARKETPLACELISTINGS', i.item_id, CONCAT('Status changed from ', d.status, ' to ', i.status)
  FROM inserted i
  INNER JOIN deleted d ON d.item_id = i.item_id
  WHERE d.status = 'Pending' AND i.status IN ('Approved', 'Rejected');
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_applied_tuition_status_update
ON dbo.APPLIEDTUITIONS
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
  SELECT i.user_id, 'booking_status_changed', 'APPLIEDTUITIONS', i.application_id, CONCAT('Application status changed from ', d.status, ' to ', i.status)
  FROM inserted i
  INNER JOIN deleted d ON d.application_id = i.application_id
  WHERE i.status <> d.status;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_applied_maid_status_update
ON dbo.APPLIEDMAIDS
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
  SELECT i.user_id, 'booking_status_changed', 'APPLIEDMAIDS', i.application_id, CONCAT('Application status changed from ', d.status, ' to ', i.status)
  FROM inserted i
  INNER JOIN deleted d ON d.application_id = i.application_id
  WHERE i.status <> d.status;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_applied_roommate_status_update
ON dbo.APPLIEDROOMMATES
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
  SELECT i.user_id, 'booking_status_changed', 'APPLIEDROOMMATES', i.application_id, CONCAT('Application status changed from ', d.status, ' to ', i.status)
  FROM inserted i
  INNER JOIN deleted d ON d.application_id = i.application_id
  WHERE i.status <> d.status;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_users_subscription_status_update
ON dbo.USERS
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
  SELECT i.user_id,
         CASE WHEN i.subscription_active = 1 THEN 'subscription_activated' ELSE 'subscription_deactivated' END,
         'USERS',
         i.user_id,
         CASE WHEN i.subscription_active = 1 THEN 'Subscription was activated' ELSE 'Subscription was deactivated' END
  FROM inserted i
  INNER JOIN deleted d ON d.user_id = i.user_id
  WHERE ISNULL(i.subscription_active, 0) <> ISNULL(d.subscription_active, 0);
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_tuitions_delete_audit
ON dbo.TUITIONS
AFTER DELETE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
  SELECT d.user_id, 'listing_deleted', 'TUITIONS', d.tuition_id, 'Tuition listing deleted'
  FROM deleted d;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_marketplace_delete_audit
ON dbo.MARKETPLACELISTINGS
AFTER DELETE
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id, activity_description)
  SELECT d.user_id, 'listing_deleted', 'MARKETPLACELISTINGS', d.item_id, 'Marketplace listing deleted'
  FROM deleted d;
END;
GO

/* =============================
   INTEGRITY HARDENING PACK
   ============================= */
IF COL_LENGTH('dbo.USERACTIVITIES', 'activity_description') IS NULL
BEGIN
  ALTER TABLE dbo.USERACTIVITIES ADD activity_description NVARCHAR(300) NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_USERS_ROLE_DOMAIN')
  ALTER TABLE dbo.USERS ADD CONSTRAINT CK_USERS_ROLE_DOMAIN CHECK (UPPER(role) IN ('ADMIN', 'STUDENT'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_SUBPAY_STATUS_DOMAIN')
  ALTER TABLE dbo.SUBSCRIPTIONPAYMENTS ADD CONSTRAINT CK_SUBPAY_STATUS_DOMAIN CHECK (LOWER(status) IN ('pending', 'paid', 'failed', 'refunded'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_SUBPAY_AMOUNT_DOMAIN')
  ALTER TABLE dbo.SUBSCRIPTIONPAYMENTS ADD CONSTRAINT CK_SUBPAY_AMOUNT_DOMAIN CHECK (amount > 0);
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_TUITIONS_STATUS_DOMAIN')
  ALTER TABLE dbo.TUITIONS ADD CONSTRAINT CK_TUITIONS_STATUS_DOMAIN CHECK (LOWER(status) IN ('pending', 'approved', 'rejected', 'open', 'closed', 'booked'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_MAIDS_STATUS_DOMAIN')
  ALTER TABLE dbo.MAIDS ADD CONSTRAINT CK_MAIDS_STATUS_DOMAIN CHECK (LOWER(status) IN ('pending', 'approved', 'rejected', 'open', 'closed', 'booked'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_ROOMMATES_STATUS_DOMAIN')
  ALTER TABLE dbo.ROOMMATELISTINGS ADD CONSTRAINT CK_ROOMMATES_STATUS_DOMAIN CHECK (LOWER(status) IN ('pending', 'approved', 'rejected', 'open', 'closed', 'booked'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_HOUSE_STATUS_DOMAIN')
  ALTER TABLE dbo.HOUSERENTLISTINGS ADD CONSTRAINT CK_HOUSE_STATUS_DOMAIN CHECK (LOWER(status) IN ('pending', 'approved', 'rejected', 'open', 'closed'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_MARKET_STATUS_DOMAIN')
  ALTER TABLE dbo.MARKETPLACELISTINGS ADD CONSTRAINT CK_MARKET_STATUS_DOMAIN CHECK (LOWER(status) IN ('pending', 'approved', 'rejected', 'available', 'sold'));
GO

IF COL_LENGTH('dbo.BOOKEDTUITIONS', 'booking_status') IS NULL
  ALTER TABLE dbo.BOOKEDTUITIONS ADD booking_status NVARCHAR(20) NOT NULL CONSTRAINT DF_BOOKEDTUITIONS_STATUS DEFAULT ('confirmed');
IF COL_LENGTH('dbo.BOOKEDMAIDS', 'booking_status') IS NULL
  ALTER TABLE dbo.BOOKEDMAIDS ADD booking_status NVARCHAR(20) NOT NULL CONSTRAINT DF_BOOKEDMAIDS_STATUS DEFAULT ('confirmed');
IF COL_LENGTH('dbo.BOOKEDROOMMATES', 'booking_status') IS NULL
  ALTER TABLE dbo.BOOKEDROOMMATES ADD booking_status NVARCHAR(20) NOT NULL CONSTRAINT DF_BOOKEDROOMMATES_STATUS DEFAULT ('confirmed');
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_BOOKEDTUITIONS_STATUS_DOMAIN')
  ALTER TABLE dbo.BOOKEDTUITIONS ADD CONSTRAINT CK_BOOKEDTUITIONS_STATUS_DOMAIN CHECK (LOWER(booking_status) IN ('confirmed', 'cancelled', 'completed'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_BOOKEDMAIDS_STATUS_DOMAIN')
  ALTER TABLE dbo.BOOKEDMAIDS ADD CONSTRAINT CK_BOOKEDMAIDS_STATUS_DOMAIN CHECK (LOWER(booking_status) IN ('confirmed', 'cancelled', 'completed'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_BOOKEDROOMMATES_STATUS_DOMAIN')
  ALTER TABLE dbo.BOOKEDROOMMATES ADD CONSTRAINT CK_BOOKEDROOMMATES_STATUS_DOMAIN CHECK (LOWER(booking_status) IN ('confirmed', 'cancelled', 'completed'));
GO

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ANNOUNCEMENTS_USERS')
  ALTER TABLE dbo.ANNOUNCEMENTS DROP CONSTRAINT FK_ANNOUNCEMENTS_USERS;
ALTER TABLE dbo.ANNOUNCEMENTS ADD CONSTRAINT FK_ANNOUNCEMENTS_USERS FOREIGN KEY (created_by) REFERENCES dbo.USERS(user_id) ON UPDATE CASCADE ON DELETE CASCADE;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SUBSCRIPTIONPAYMENTS_USERS')
  ALTER TABLE dbo.SUBSCRIPTIONPAYMENTS DROP CONSTRAINT FK_SUBSCRIPTIONPAYMENTS_USERS;
ALTER TABLE dbo.SUBSCRIPTIONPAYMENTS ADD CONSTRAINT FK_SUBSCRIPTIONPAYMENTS_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id) ON UPDATE CASCADE ON DELETE CASCADE;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_USERACTIVITIES_USERS')
  ALTER TABLE dbo.USERACTIVITIES DROP CONSTRAINT FK_USERACTIVITIES_USERS;
ALTER TABLE dbo.USERACTIVITIES ADD CONSTRAINT FK_USERACTIVITIES_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id) ON UPDATE CASCADE ON DELETE CASCADE;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_TUITIONS_USERS')
  ALTER TABLE dbo.TUITIONS DROP CONSTRAINT FK_TUITIONS_USERS;
ALTER TABLE dbo.TUITIONS ADD CONSTRAINT FK_TUITIONS_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id) ON UPDATE CASCADE ON DELETE CASCADE;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_MAIDS_USERS')
  ALTER TABLE dbo.MAIDS DROP CONSTRAINT FK_MAIDS_USERS;
ALTER TABLE dbo.MAIDS ADD CONSTRAINT FK_MAIDS_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id) ON UPDATE CASCADE ON DELETE CASCADE;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ROOMMATES_USERS')
  ALTER TABLE dbo.ROOMMATELISTINGS DROP CONSTRAINT FK_ROOMMATES_USERS;
ALTER TABLE dbo.ROOMMATELISTINGS ADD CONSTRAINT FK_ROOMMATES_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id) ON UPDATE CASCADE ON DELETE CASCADE;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HOUSE_USERS')
  ALTER TABLE dbo.HOUSERENTLISTINGS DROP CONSTRAINT FK_HOUSE_USERS;
ALTER TABLE dbo.HOUSERENTLISTINGS ADD CONSTRAINT FK_HOUSE_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id) ON UPDATE CASCADE ON DELETE CASCADE;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_MARKET_USERS')
  ALTER TABLE dbo.MARKETPLACELISTINGS DROP CONSTRAINT FK_MARKET_USERS;
ALTER TABLE dbo.MARKETPLACELISTINGS ADD CONSTRAINT FK_MARKET_USERS FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id) ON UPDATE CASCADE ON DELETE CASCADE;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HOUSECONTACTS_HOUSE')
  ALTER TABLE dbo.HOUSECONTACTS DROP CONSTRAINT FK_HOUSECONTACTS_HOUSE;
ALTER TABLE dbo.HOUSECONTACTS ADD CONSTRAINT FK_HOUSECONTACTS_HOUSE FOREIGN KEY (house_id) REFERENCES dbo.HOUSERENTLISTINGS(house_id) ON UPDATE CASCADE ON DELETE CASCADE;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_HOUSECONTACTS_USER')
  ALTER TABLE dbo.HOUSECONTACTS DROP CONSTRAINT FK_HOUSECONTACTS_USER;
ALTER TABLE dbo.HOUSECONTACTS ADD CONSTRAINT FK_HOUSECONTACTS_USER FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id) ON UPDATE NO ACTION ON DELETE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_USERS_ROLE_CREATED_AT' AND object_id = OBJECT_ID('dbo.USERS'))
  CREATE INDEX IX_USERS_ROLE_CREATED_AT ON dbo.USERS(role, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ANNOUNCEMENTS_CREATED_BY' AND object_id = OBJECT_ID('dbo.ANNOUNCEMENTS'))
  CREATE INDEX IX_ANNOUNCEMENTS_CREATED_BY ON dbo.ANNOUNCEMENTS(created_by, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TUITIONS_USER_STATUS_CREATED' AND object_id = OBJECT_ID('dbo.TUITIONS'))
  CREATE INDEX IX_TUITIONS_USER_STATUS_CREATED ON dbo.TUITIONS(user_id, status, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MAIDS_USER_STATUS_CREATED' AND object_id = OBJECT_ID('dbo.MAIDS'))
  CREATE INDEX IX_MAIDS_USER_STATUS_CREATED ON dbo.MAIDS(user_id, status, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ROOMMATES_USER_STATUS_CREATED' AND object_id = OBJECT_ID('dbo.ROOMMATELISTINGS'))
  CREATE INDEX IX_ROOMMATES_USER_STATUS_CREATED ON dbo.ROOMMATELISTINGS(user_id, status, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_HOUSE_USER_STATUS_CREATED' AND object_id = OBJECT_ID('dbo.HOUSERENTLISTINGS'))
  CREATE INDEX IX_HOUSE_USER_STATUS_CREATED ON dbo.HOUSERENTLISTINGS(user_id, status, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MARKET_USER_STATUS_CREATED' AND object_id = OBJECT_ID('dbo.MARKETPLACELISTINGS'))
  CREATE INDEX IX_MARKET_USER_STATUS_CREATED ON dbo.MARKETPLACELISTINGS(user_id, status, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SUBPAY_USER_STATUS_DATE' AND object_id = OBJECT_ID('dbo.SUBSCRIPTIONPAYMENTS'))
  CREATE INDEX IX_SUBPAY_USER_STATUS_DATE ON dbo.SUBSCRIPTIONPAYMENTS(user_id, status, payment_date DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AT_USER_STATUS_APPLIED' AND object_id = OBJECT_ID('dbo.APPLIEDTUITIONS'))
  CREATE INDEX IX_AT_USER_STATUS_APPLIED ON dbo.APPLIEDTUITIONS(user_id, status, applied_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AM_USER_STATUS_APPLIED' AND object_id = OBJECT_ID('dbo.APPLIEDMAIDS'))
  CREATE INDEX IX_AM_USER_STATUS_APPLIED ON dbo.APPLIEDMAIDS(user_id, status, applied_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AR_USER_STATUS_APPLIED' AND object_id = OBJECT_ID('dbo.APPLIEDROOMMATES'))
  CREATE INDEX IX_AR_USER_STATUS_APPLIED ON dbo.APPLIEDROOMMATES(user_id, status, applied_at DESC);
GO
