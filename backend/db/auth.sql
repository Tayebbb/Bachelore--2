/*
  BacheLORE API SQL Command Reference
  Source: backend/routes/api.js
  Notes:
  - Parameters use the same names as the JS request inputs.
  - This file is a centralized reference for all runtime SQL commands.
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* =========================
	Common / Utility Queries
========================= */

-- Health check
SELECT 1 AS ok;

-- Resolve fallback admin actor
SELECT TOP 1
    user_id
FROM dbo.USERS
WHERE role = 'admin'
ORDER BY created_at ASC;

-- Activity log insert (used by logActivity helper)
INSERT INTO dbo.USERACTIVITIES
    (user_id, action_type, reference_table, reference_id)
VALUES
    (@user_id, @action_type, @reference_table, @reference_id);

/* =========================
	Auth: Signup / Login
========================= */

-- Signup: check existing email
SELECT user_id
FROM dbo.USERS
WHERE email = @email;

-- Signup: insert user
INSERT INTO dbo.USERS
    (name, email, password_hash, role)
OUTPUT
INSERTED.user_id,
INSERTED.name,
INSERTED.email,
INSERTED.role,
INSERTED.created_at
VALUES
    (@name, @email, @password_hash, 'student');

-- Login: fetch user by email
SELECT user_id, name, email, password_hash, role, created_at
FROM dbo.USERS
WHERE email = @email;

/* =========================
	Announcements
========================= */

SELECT a.announcement_id AS _id, a.announcement_id, a.title, a.message, a.created_at,
    a.created_by AS adminId,
    u.name AS createdByName
FROM dbo.ANNOUNCEMENTS a
    JOIN dbo.USERS u ON u.user_id = a.created_by
ORDER BY a.created_at DESC;

INSERT INTO dbo.ANNOUNCEMENTS
    (title, message, created_by)
OUTPUT
INSERTED.announcement_id
AS
_id,
INSERTED.announcement_id,
INSERTED.title,
INSERTED.message,
INSERTED.created_at
VALUES
    (@title, @message, @created_by);

/* =========================
	Tuitions
========================= */

SELECT t.tuition_id AS _id, t.tuition_id, t.user_id, t.subject, t.subject AS title, t.salary, t.location,
    t.status, t.created_at
FROM dbo.TUITIONS t
ORDER BY t.created_at DESC;

INSERT INTO dbo.TUITIONS
    (user_id, subject, salary, location, status)
OUTPUT
INSERTED.tuition_id
AS
_id,
INSERTED.tuition_id,
INSERTED.user_id,
INSERTED.subject,
INSERTED.subject
AS
title,
INSERTED.salary,
INSERTED.location,
INSERTED.status,
INSERTED.created_at
VALUES
    (@user_id, @subject, @salary, @location, @status);

-- Applied tuitions
INSERT INTO dbo.APPLIEDTUITIONS
    (tuition_id, user_id, status)
OUTPUT
INSERTED.application_id
AS
_id,
INSERTED.application_id,
INSERTED.tuition_id,
INSERTED.user_id,
INSERTED.status,
INSERTED.applied_at
VALUES
    (@tuition_id, @user_id, @status);

SELECT a.application_id AS _id, a.application_id, a.tuition_id AS tuitionId, a.user_id AS userId, a.status, a.applied_at,
    u.name, u.email
FROM dbo.APPLIEDTUITIONS a
    JOIN dbo.USERS u ON u.user_id = a.user_id
ORDER BY a.applied_at DESC;

DELETE FROM dbo.APPLIEDTUITIONS
WHERE application_id = @application_id;

SELECT application_id, user_id
FROM dbo.APPLIEDTUITIONS
WHERE application_id = @application_id;

INSERT INTO dbo.BOOKEDTUITIONS
    (application_id)
OUTPUT
INSERTED.booking_id
AS
_id,
INSERTED.booking_id,
INSERTED.application_id,
INSERTED.confirmed_at
VALUES
    (@application_id);

UPDATE dbo.APPLIEDTUITIONS
SET status = 'booked'
WHERE application_id = @application_id;

SELECT b.booking_id AS _id, b.booking_id, b.application_id, b.confirmed_at,
    t.subject AS title, t.location,
    u.name AS applicantName, u.email AS applicantEmail
FROM dbo.BOOKEDTUITIONS b
    JOIN dbo.APPLIEDTUITIONS a ON a.application_id = b.application_id
    JOIN dbo.TUITIONS t ON t.tuition_id = a.tuition_id
    JOIN dbo.USERS u ON u.user_id = a.user_id
ORDER BY b.confirmed_at DESC;

SELECT b.booking_id, b.application_id, a.user_id
FROM dbo.BOOKEDTUITIONS b
    JOIN dbo.APPLIEDTUITIONS a ON a.application_id = b.application_id
WHERE b.booking_id = @booking_id;

DELETE FROM dbo.BOOKEDTUITIONS
WHERE booking_id = @booking_id;

UPDATE dbo.APPLIEDTUITIONS
SET status = 'pending'
WHERE application_id = @application_id;

/* =========================
	Maids
========================= */

SELECT m.maid_id AS _id, m.maid_id, m.user_id, m.salary, m.salary AS hourlyRate,
    m.location, m.availability, m.availability AS name, m.created_at
FROM dbo.MAIDS m
ORDER BY m.created_at DESC;

INSERT INTO dbo.MAIDS
    (user_id, salary, location, availability)
OUTPUT
INSERTED.maid_id
AS
_id,
INSERTED.maid_id,
INSERTED.user_id,
INSERTED.salary,
INSERTED.salary
AS
hourlyRate,
INSERTED.location,
INSERTED.availability,
INSERTED.availability
AS
name,
INSERTED.created_at
VALUES
    (@user_id, @salary, @location, @availability);

INSERT INTO dbo.APPLIEDMAIDS
    (maid_id, user_id, status)
OUTPUT
INSERTED.application_id
AS
_id,
INSERTED.application_id,
INSERTED.maid_id,
INSERTED.user_id,
INSERTED.status,
INSERTED.applied_at
VALUES
    (@maid_id, @user_id, @status);

SELECT a.application_id AS _id, a.application_id, a.maid_id AS maidId, a.user_id AS userId,
    a.status, a.applied_at, u.name, u.email
FROM dbo.APPLIEDMAIDS a
    JOIN dbo.USERS u ON u.user_id = a.user_id
ORDER BY a.applied_at DESC;

DELETE FROM dbo.APPLIEDMAIDS
WHERE application_id = @application_id;

SELECT application_id, user_id
FROM dbo.APPLIEDMAIDS
WHERE application_id = @application_id;

INSERT INTO dbo.BOOKEDMAIDS
    (application_id)
OUTPUT
INSERTED.booking_id
AS
_id,
INSERTED.booking_id,
INSERTED.application_id,
INSERTED.confirmed_at
VALUES
    (@application_id);

UPDATE dbo.APPLIEDMAIDS
SET status = 'booked'
WHERE application_id = @application_id;

SELECT b.booking_id AS _id, b.booking_id, b.application_id, b.confirmed_at,
    m.location, m.availability AS name,
    u.name AS applicantName, u.email AS applicantEmail
FROM dbo.BOOKEDMAIDS b
    JOIN dbo.APPLIEDMAIDS a ON a.application_id = b.application_id
    JOIN dbo.MAIDS m ON m.maid_id = a.maid_id
    JOIN dbo.USERS u ON u.user_id = a.user_id
ORDER BY b.confirmed_at DESC;

SELECT b.booking_id, b.application_id, a.user_id
FROM dbo.BOOKEDMAIDS b
    JOIN dbo.APPLIEDMAIDS a ON a.application_id = b.application_id
WHERE b.booking_id = @booking_id;

DELETE FROM dbo.BOOKEDMAIDS
WHERE booking_id = @booking_id;

UPDATE dbo.APPLIEDMAIDS
SET status = 'pending'
WHERE application_id = @application_id;

/* =========================
	Roommates
========================= */

SELECT r.listing_id AS _id, r.listing_id, r.user_id, r.location, r.rent, r.preference, r.type, r.created_at,
    u.name, u.email
FROM dbo.ROOMMATELISTINGS r
    JOIN dbo.USERS u ON u.user_id = r.user_id
WHERE r.type = 'host'
ORDER BY r.created_at DESC;

SELECT TOP 1
    listing_id AS _id, listing_id, user_id, location, rent, preference, type, created_at
FROM dbo.ROOMMATELISTINGS
WHERE user_id = @user_id AND type = 'host'
ORDER BY created_at DESC;

INSERT INTO dbo.ROOMMATELISTINGS
    (user_id, location, rent, preference, type)
OUTPUT
INSERTED.listing_id
AS
_id,
INSERTED.listing_id,
INSERTED.user_id,
INSERTED.location,
INSERTED.rent,
INSERTED.preference,
INSERTED.type,
INSERTED.created_at
VALUES
    (@user_id, @location, @rent, @preference, @type);

UPDATE dbo.ROOMMATELISTINGS
SET location = @location, rent = @rent, preference = @preference
OUTPUT INSERTED.listing_id AS _id, INSERTED.listing_id, INSERTED.user_id, INSERTED.location,
		 INSERTED.rent, INSERTED.preference, INSERTED.type, INSERTED.created_at
WHERE user_id = @user_id AND type = 'host';

DELETE FROM dbo.ROOMMATELISTINGS
WHERE user_id = @user_id AND type = 'host';

INSERT INTO dbo.APPLIEDROOMMATES
    (listing_id, user_id, status)
OUTPUT
INSERTED.application_id
AS
_id,
INSERTED.application_id,
INSERTED.listing_id,
INSERTED.user_id,
INSERTED.status,
INSERTED.applied_at
VALUES
    (@listing_id, @user_id, @status);

SELECT a.application_id AS _id, a.application_id, a.listing_id, a.user_id, a.status, a.applied_at,
    u.name, u.email, r.location, r.preference
FROM dbo.APPLIEDROOMMATES a
    JOIN dbo.USERS u ON u.user_id = a.user_id
    JOIN dbo.ROOMMATELISTINGS r ON r.listing_id = a.listing_id
ORDER BY a.applied_at DESC;

DELETE FROM dbo.APPLIEDROOMMATES
WHERE application_id = @application_id;

SELECT application_id, user_id
FROM dbo.APPLIEDROOMMATES
WHERE application_id = @application_id;

INSERT INTO dbo.BOOKEDROOMMATES
    (application_id)
OUTPUT
INSERTED.booking_id
AS
_id,
INSERTED.booking_id,
INSERTED.application_id,
INSERTED.confirmed_at
VALUES
    (@application_id);

UPDATE dbo.APPLIEDROOMMATES
SET status = 'booked'
WHERE application_id = @application_id;

SELECT b.booking_id AS _id, b.booking_id, b.application_id, b.confirmed_at,
    applicant.name AS applicantName, applicant.email AS applicantEmail,
    host.name AS hostName, host.email AS hostEmail,
    r.location, r.preference
FROM dbo.BOOKEDROOMMATES b
    JOIN dbo.APPLIEDROOMMATES a ON a.application_id = b.application_id
    JOIN dbo.USERS applicant ON applicant.user_id = a.user_id
    JOIN dbo.ROOMMATELISTINGS r ON r.listing_id = a.listing_id
    JOIN dbo.USERS host ON host.user_id = r.user_id
ORDER BY b.confirmed_at DESC;

SELECT b.booking_id, b.application_id, a.user_id
FROM dbo.BOOKEDROOMMATES b
    JOIN dbo.APPLIEDROOMMATES a ON a.application_id = b.application_id
WHERE b.booking_id = @booking_id;

DELETE FROM dbo.BOOKEDROOMMATES
WHERE booking_id = @booking_id;

UPDATE dbo.APPLIEDROOMMATES
SET status = 'pending'
WHERE application_id = @application_id;

/* =========================
	House Rent
========================= */

SELECT house_id AS _id, house_id, user_id, location, rent AS price, rent, rooms,
    description, created_at
FROM dbo.HOUSERENTLISTINGS
ORDER BY created_at DESC;

INSERT INTO dbo.HOUSERENTLISTINGS
    (user_id, location, rent, rooms, description)
OUTPUT
INSERTED.house_id
AS
_id,
INSERTED.house_id,
INSERTED.user_id,
INSERTED.location,
INSERTED.rent
AS
price,
INSERTED.rent,
INSERTED.rooms,
INSERTED.description,
INSERTED.created_at
VALUES
    (@user_id, @location, @rent, @rooms, @description);

DELETE FROM dbo.HOUSERENTLISTINGS
WHERE house_id = @house_id;

INSERT INTO dbo.HOUSECONTACTS
    (house_id, user_id, message)
OUTPUT
INSERTED.contact_id
AS
_id,
INSERTED.contact_id,
INSERTED.house_id,
INSERTED.user_id,
INSERTED.message,
INSERTED.created_at
VALUES
    (@house_id, @user_id, @message);

SELECT c.contact_id AS _id, c.contact_id, c.house_id, c.user_id, c.message, c.created_at,
    h.location, h.rent, h.rooms
FROM dbo.HOUSECONTACTS c
    JOIN dbo.HOUSERENTLISTINGS h ON h.house_id = c.house_id
WHERE c.user_id = @user_id
ORDER BY c.created_at DESC;

/* =========================
	Marketplace
========================= */

SELECT m.item_id AS _id, m.item_id, m.user_id, m.title, m.price, m.[condition], m.status, m.created_at,
    u.email AS sellerEmail
FROM dbo.MARKETPLACELISTINGS m
    JOIN dbo.USERS u ON u.user_id = m.user_id
ORDER BY m.created_at DESC;

INSERT INTO dbo.MARKETPLACELISTINGS
    (user_id, title, price, [condition], status)
OUTPUT
INSERTED.item_id
AS
_id,
INSERTED.item_id,
INSERTED.user_id,
INSERTED.title,
INSERTED.price,
INSERTED.[condition],
INSERTED.status,
INSERTED.created_at
VALUES
    (@user_id, @title, @price, @condition, @status);

UPDATE dbo.MARKETPLACELISTINGS
SET status = 'sold'
OUTPUT INSERTED.item_id AS _id, INSERTED.item_id, INSERTED.user_id, INSERTED.title,
		 INSERTED.price, INSERTED.[condition], INSERTED.status, INSERTED.created_at
WHERE item_id = @item_id;

/* =========================
	Subscription
========================= */

INSERT INTO dbo.SUBSCRIPTIONPAYMENTS
    (user_id, amount, status)
OUTPUT
INSERTED.payment_id
AS
_id,
INSERTED.payment_id,
INSERTED.user_id,
INSERTED.amount,
INSERTED.status,
INSERTED.payment_date
VALUES
    (@user_id, @amount, @status);

SELECT payment_id AS _id, payment_id, user_id, amount, status, payment_date
FROM dbo.SUBSCRIPTIONPAYMENTS
WHERE user_id = @user_id
ORDER BY payment_date DESC;

/* =========================
	Activity + Users
========================= */

-- Activity list (all users)
SELECT activity_id AS _id, activity_id, user_id, action_type, reference_table, reference_id, [timestamp]
FROM dbo.USERACTIVITIES
ORDER BY [timestamp] DESC;

-- Activity list (single user)
SELECT activity_id AS _id, activity_id, user_id, action_type, reference_table, reference_id, [timestamp]
FROM dbo.USERACTIVITIES
WHERE user_id = @user_id
ORDER BY [timestamp] DESC;

-- Users list
SELECT user_id AS _id, user_id, name, email, role, created_at
FROM dbo.USERS
ORDER BY created_at DESC;

