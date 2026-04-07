import express from 'express';
import bcrypt from 'bcryptjs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequest, getPool, sql } from '../db/connection.js';
import { getAuthUserId, requireAuth, requireRole } from '../utils/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_USERS_FILE = path.join(__dirname, '..', 'db', 'local-users.json');

router.use(requireAuth, requireRole('student'));

async function readLocalUsers() {
  try {
    const raw = await fs.readFile(LOCAL_USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function ensureSqlUserExists(pool, userData = {}) {
  const userId = String(userData.userId || userData.user_id || '').trim();
  const email = String(userData.email || '').trim().toLowerCase();
  const name = String(userData.name || userData.fullName || 'Student').trim() || 'Student';
  const role = String(userData.role || 'student').trim().toLowerCase() === 'admin' ? 'admin' : 'student';

  const byId = userId
    ? await pool.request().input('user_id', sql.UniqueIdentifier, userId).query('SELECT user_id FROM dbo.USERS WHERE user_id = @user_id')
    : { recordset: [] };
  if (byId.recordset?.length) return byId.recordset[0].user_id;

  const byEmail = email
    ? await pool.request().input('email', sql.NVarChar(180), email).query('SELECT user_id FROM dbo.USERS WHERE LOWER(email) = LOWER(@email)')
    : { recordset: [] };
  if (byEmail.recordset?.length) return byEmail.recordset[0].user_id;

  const localUsers = await readLocalUsers();
  const localUser = localUsers.find((entry) => {
    const localEmail = String(entry?.email || '').trim().toLowerCase();
    return (userId && String(entry?.user_id || '').trim() === userId) || (email && localEmail === email);
  });

  if (!localUser) return null;

  const created = await pool
    .request()
    .input('user_id', sql.UniqueIdentifier, localUser.user_id)
    .input('name', sql.NVarChar(120), localUser.name || name)
    .input('email', sql.NVarChar(180), String(localUser.email || email).toLowerCase())
    .input('password_hash', sql.NVarChar(255), localUser.password_hash || bcrypt.hashSync('temp-password-123!', 10))
    .input('role', sql.NVarChar(20), role)
    .query(`
      INSERT INTO dbo.USERS (user_id, name, email, password_hash, role)
      SELECT @user_id, @name, @email, @password_hash, @role
      WHERE NOT EXISTS (SELECT 1 FROM dbo.USERS WHERE user_id = @user_id OR LOWER(email) = LOWER(@email));

      SELECT user_id FROM dbo.USERS WHERE user_id = @user_id OR LOWER(email) = LOWER(@email);
    `);

  return created.recordset?.[0]?.user_id || null;
}

async function logActivity(poolOrTx, userId, actionType, referenceTable, referenceId = null) {
  if (!userId) return;
  await createRequest(poolOrTx)
    .input('user_id', sql.UniqueIdentifier, userId)
    .input('action_type', sql.NVarChar(80), actionType)
    .input('reference_table', sql.NVarChar(80), referenceTable)
    .input('reference_id', sql.UniqueIdentifier, referenceId)
    .query(`
      INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
      VALUES (@user_id, @action_type, @reference_table, @reference_id);
    `);
}

async function hasActiveSubscription(pool, userId) {
  const check = await pool
    .request()
    .input('user_id', sql.UniqueIdentifier, userId)
    .query(`
      SELECT TOP 1
        ISNULL(u.subscription_active, 0) AS subscription_active,
        latest.status AS latest_status
      FROM dbo.USERS u
      OUTER APPLY (
        SELECT TOP 1 status, payment_date, payment_id
        FROM dbo.SUBSCRIPTIONPAYMENTS
        WHERE user_id = @user_id
        ORDER BY payment_date DESC, payment_id DESC
      ) latest
      WHERE u.user_id = @user_id;
    `);

  const row = check.recordset?.[0] || {};
  const latest = String(row.latest_status || '').toLowerCase();
  return Number(row.subscription_active || 0) === 1 || latest === 'paid';
}

async function ensureMarketplaceApplicationsTable(poolOrTx) {
  await createRequest(poolOrTx).query(`
    IF OBJECT_ID('dbo.APPLIEDMARKETPLACE', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.APPLIEDMARKETPLACE (
        application_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_APPLIEDMARKETPLACE PRIMARY KEY DEFAULT NEWID(),
        item_id UNIQUEIDENTIFIER NOT NULL,
        user_id UNIQUEIDENTIFIER NOT NULL,
        status NVARCHAR(30) NOT NULL CONSTRAINT DF_APPLIEDMARKETPLACE_STATUS DEFAULT ('pending'),
        applied_at DATETIME2 NOT NULL CONSTRAINT DF_APPLIEDMARKETPLACE_APPLIED_AT DEFAULT GETUTCDATE()
      );

      ALTER TABLE dbo.APPLIEDMARKETPLACE
      ADD CONSTRAINT FK_APPLIEDMARKETPLACE_MARKETPLACELISTINGS
      FOREIGN KEY (item_id) REFERENCES dbo.MARKETPLACELISTINGS(item_id)
      ON UPDATE CASCADE ON DELETE CASCADE;

      ALTER TABLE dbo.APPLIEDMARKETPLACE
      ADD CONSTRAINT FK_APPLIEDMARKETPLACE_USERS
      FOREIGN KEY (user_id) REFERENCES dbo.USERS(user_id)
      ON UPDATE CASCADE ON DELETE CASCADE;

      ALTER TABLE dbo.APPLIEDMARKETPLACE
      ADD CONSTRAINT CK_APPLIEDMARKETPLACE_STATUS
      CHECK (LOWER(status) IN ('pending', 'approved', 'rejected', 'booked'));

      CREATE INDEX IX_APPLIEDMARKETPLACE_ITEM_STATUS_APPLIED
      ON dbo.APPLIEDMARKETPLACE(item_id, status, applied_at DESC);

      CREATE INDEX IX_APPLIEDMARKETPLACE_USER_STATUS_APPLIED
      ON dbo.APPLIEDMARKETPLACE(user_id, status, applied_at DESC);
    END
  `);
}

router.get('/dashboard', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const pool = await getPool();
    await ensureMarketplaceApplicationsTable(pool);

    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
        SELECT
          @user_id AS user_id,
          (SELECT COUNT(*) FROM dbo.APPLIEDTUITIONS WHERE user_id = @user_id)
            + (SELECT COUNT(*) FROM dbo.APPLIEDMAIDS WHERE user_id = @user_id)
            + (SELECT COUNT(*) FROM dbo.APPLIEDROOMMATES WHERE user_id = @user_id)
            + (SELECT COUNT(*) FROM dbo.APPLIEDHOUSERENTS WHERE user_id = @user_id)
            + (SELECT COUNT(*) FROM dbo.APPLIEDMARKETPLACE WHERE user_id = @user_id) AS total_applications,
          (SELECT COUNT(*) FROM dbo.TUITIONS WHERE user_id = @user_id)
            + (SELECT COUNT(*) FROM dbo.MAIDS WHERE user_id = @user_id)
            + (SELECT COUNT(*) FROM dbo.ROOMMATELISTINGS WHERE user_id = @user_id)
            + (SELECT COUNT(*) FROM dbo.HOUSERENTLISTINGS WHERE user_id = @user_id)
            + (SELECT COUNT(*) FROM dbo.MARKETPLACELISTINGS WHERE user_id = @user_id) AS total_listings,
          (SELECT COUNT(*) FROM dbo.APPLIEDTUITIONS WHERE user_id = @user_id AND LOWER(ISNULL(status, 'pending')) IN ('approved','booked'))
            + (SELECT COUNT(*) FROM dbo.APPLIEDMAIDS WHERE user_id = @user_id AND LOWER(ISNULL(status, 'pending')) IN ('approved','booked'))
            + (SELECT COUNT(*) FROM dbo.APPLIEDROOMMATES WHERE user_id = @user_id AND LOWER(ISNULL(status, 'pending')) IN ('approved','booked'))
            + (SELECT COUNT(*) FROM dbo.APPLIEDHOUSERENTS WHERE user_id = @user_id AND LOWER(ISNULL(status, 'pending')) IN ('approved','booked'))
            + (SELECT COUNT(*) FROM dbo.APPLIEDMARKETPLACE WHERE user_id = @user_id AND LOWER(ISNULL(status, 'pending')) IN ('approved','booked')) AS total_bookings,
          (SELECT ISNULL(SUM(amount), 0) FROM dbo.SUBSCRIPTIONPAYMENTS WHERE user_id = @user_id AND status = 'paid') AS total_payments;

        SELECT TOP 300 *
        FROM (
          SELECT
            'tuition' AS module,
            a.application_id,
            CONCAT('Tuition - ', t.subject, ' - ', t.location) AS listing_title,
            a.status,
            a.applied_at
          FROM dbo.APPLIEDTUITIONS a
          INNER JOIN dbo.TUITIONS t ON t.tuition_id = a.tuition_id
          WHERE a.user_id = @user_id

          UNION ALL

          SELECT
            'maid' AS module,
            a.application_id,
            CONCAT('Maid - ', m.location) AS listing_title,
            a.status,
            a.applied_at
          FROM dbo.APPLIEDMAIDS a
          INNER JOIN dbo.MAIDS m ON m.maid_id = a.maid_id
          WHERE a.user_id = @user_id

          UNION ALL

          SELECT
            'roommate' AS module,
            a.application_id,
            CONCAT('Roommate - ', r.location) AS listing_title,
            a.status,
            a.applied_at
          FROM dbo.APPLIEDROOMMATES a
          INNER JOIN dbo.ROOMMATELISTINGS r ON r.listing_id = a.listing_id
          WHERE a.user_id = @user_id

          UNION ALL

          SELECT
            'houserent' AS module,
            a.application_id,
            CONCAT('House Rent - ', h.location) AS listing_title,
            ISNULL(a.status, 'pending') AS status,
            a.applied_at
          FROM dbo.APPLIEDHOUSERENTS a
          INNER JOIN dbo.HOUSERENTLISTINGS h ON h.house_id = a.house_id
          WHERE a.user_id = @user_id

          UNION ALL

          SELECT
            'marketplace' AS module,
            a.application_id,
            CONCAT('Marketplace - ', m.title) AS listing_title,
            a.status,
            a.applied_at
          FROM dbo.APPLIEDMARKETPLACE a
          INNER JOIN dbo.MARKETPLACELISTINGS m ON m.item_id = a.item_id
          WHERE a.user_id = @user_id
        ) req
        ORDER BY applied_at DESC;

        SELECT TOP 1
          CASE
            WHEN ISNULL(u.subscription_active, 0) = 1 THEN 'active'
            WHEN LOWER(ISNULL(latest.status, '')) = 'paid' THEN 'active'
            ELSE 'inactive'
          END AS subscription_status,
          ISNULL(u.subscription_active, 0) AS subscription_active,
          latest.status AS latest_payment_status,
          latest.payment_date AS latest_payment_date
        FROM dbo.USERS u
        OUTER APPLY (
          SELECT TOP 1 status, payment_date, payment_id
          FROM dbo.SUBSCRIPTIONPAYMENTS
          WHERE user_id = @user_id
          ORDER BY payment_date DESC, payment_id DESC
        ) latest
        WHERE u.user_id = @user_id;
      `);

    const emptyCounts = { pending_count: 0, approved_count: 0, booked_count: 0 };

    const mapListingsWithApplications = (listings, applicants, counts) => {
      const applicantsByListing = new Map();
      for (const applicant of applicants) {
        const key = String(applicant.listing_id || '');
        if (!applicantsByListing.has(key)) applicantsByListing.set(key, []);
        applicantsByListing.get(key).push(applicant);
      }

      const countsByListing = new Map();
      for (const row of counts) {
        countsByListing.set(String(row.listing_id || ''), {
          pending_count: Number(row.pending_count || 0),
          approved_count: Number(row.approved_count || 0),
          booked_count: Number(row.booked_count || 0),
        });
      }

      return listings.map((listing) => {
        const key = String(listing.listing_id || '');
        return {
          ...listing,
          approvedApplicants: applicantsByListing.get(key) || [],
          applicationCounts: countsByListing.get(key) || emptyCounts,
        };
      });
    };

    const loadRoommateListings = async () => {
      const [listingsResult, applicantsResult, countsResult] = await Promise.all([
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT r.listing_id, r.location, r.rent, r.preference, r.[type], r.status, r.created_at, 'roommate' AS listing_type
            FROM dbo.ROOMMATELISTINGS r
            WHERE r.user_id = @user_id
          `),
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT a.listing_id, a.user_id, a.status, a.applied_at, u.name AS applicant_name, u.email AS applicant_email
            FROM dbo.APPLIEDROOMMATES a
            INNER JOIN dbo.ROOMMATELISTINGS r ON r.listing_id = a.listing_id
            INNER JOIN dbo.USERS u ON u.user_id = a.user_id
            WHERE r.user_id = @user_id
              AND LOWER(ISNULL(a.status, 'pending')) IN ('approved', 'booked')
          `),
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT
              a.listing_id,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) IN ('pending','applied') THEN 1 ELSE 0 END) AS pending_count,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) = 'approved' THEN 1 ELSE 0 END) AS approved_count,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) = 'booked' THEN 1 ELSE 0 END) AS booked_count
            FROM dbo.APPLIEDROOMMATES a
            INNER JOIN dbo.ROOMMATELISTINGS r ON r.listing_id = a.listing_id
            WHERE r.user_id = @user_id
            GROUP BY a.listing_id
          `),
      ]);

      return mapListingsWithApplications(
        listingsResult.recordset || [],
        applicantsResult.recordset || [],
        countsResult.recordset || [],
      );
    };

    const loadTuitionListings = async () => {
      const [listingsResult, applicantsResult, countsResult] = await Promise.all([
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT t.tuition_id AS listing_id, t.subject AS location, t.salary AS rent, NULL AS preference, 'tuition' AS [type], t.status, t.created_at, 'tuition' AS listing_type
            FROM dbo.TUITIONS t
            WHERE t.user_id = @user_id
          `),
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT a.tuition_id AS listing_id, a.user_id, a.status, a.applied_at, u.name AS applicant_name, u.email AS applicant_email
            FROM dbo.APPLIEDTUITIONS a
            INNER JOIN dbo.TUITIONS t ON t.tuition_id = a.tuition_id
            INNER JOIN dbo.USERS u ON u.user_id = a.user_id
            WHERE t.user_id = @user_id
              AND LOWER(ISNULL(a.status, 'pending')) IN ('approved', 'booked')
          `),
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT
              a.tuition_id AS listing_id,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) IN ('pending','applied') THEN 1 ELSE 0 END) AS pending_count,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) = 'approved' THEN 1 ELSE 0 END) AS approved_count,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) = 'booked' THEN 1 ELSE 0 END) AS booked_count
            FROM dbo.APPLIEDTUITIONS a
            INNER JOIN dbo.TUITIONS t ON t.tuition_id = a.tuition_id
            WHERE t.user_id = @user_id
            GROUP BY a.tuition_id
          `),
      ]);

      return mapListingsWithApplications(
        listingsResult.recordset || [],
        applicantsResult.recordset || [],
        countsResult.recordset || [],
      );
    };

    const loadMaidListings = async () => {
      const [listingsResult, applicantsResult, countsResult] = await Promise.all([
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT m.maid_id AS listing_id, m.location, m.salary AS rent, NULL AS preference, 'maid' AS [type], ISNULL(m.status, 'Approved') AS status, m.created_at, 'maid' AS listing_type
            FROM dbo.MAIDS m
            WHERE m.user_id = @user_id
          `),
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT a.maid_id AS listing_id, a.user_id, a.status, a.applied_at, u.name AS applicant_name, u.email AS applicant_email
            FROM dbo.APPLIEDMAIDS a
            INNER JOIN dbo.MAIDS m ON m.maid_id = a.maid_id
            INNER JOIN dbo.USERS u ON u.user_id = a.user_id
            WHERE m.user_id = @user_id
              AND LOWER(ISNULL(a.status, 'pending')) IN ('approved', 'booked')
          `),
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT
              a.maid_id AS listing_id,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) IN ('pending','applied') THEN 1 ELSE 0 END) AS pending_count,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) = 'approved' THEN 1 ELSE 0 END) AS approved_count,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) = 'booked' THEN 1 ELSE 0 END) AS booked_count
            FROM dbo.APPLIEDMAIDS a
            INNER JOIN dbo.MAIDS m ON m.maid_id = a.maid_id
            WHERE m.user_id = @user_id
            GROUP BY a.maid_id
          `),
      ]);

      return mapListingsWithApplications(
        listingsResult.recordset || [],
        applicantsResult.recordset || [],
        countsResult.recordset || [],
      );
    };

    const loadHouseListings = async () => {
      const [listingsResult, applicantsResult, countsResult] = await Promise.all([
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT h.house_id AS listing_id, h.location, h.rent, NULL AS preference, 'house' AS [type], ISNULL(h.status, 'Approved') AS status, h.created_at, 'house' AS listing_type
            FROM dbo.HOUSERENTLISTINGS h
            WHERE h.user_id = @user_id
          `),
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT a.house_id AS listing_id, a.user_id, a.status, a.applied_at, u.name AS applicant_name, u.email AS applicant_email
            FROM dbo.APPLIEDHOUSERENTS a
            INNER JOIN dbo.HOUSERENTLISTINGS h ON h.house_id = a.house_id
            INNER JOIN dbo.USERS u ON u.user_id = a.user_id
            WHERE h.user_id = @user_id
              AND LOWER(ISNULL(a.status, 'pending')) IN ('approved', 'booked')
          `),
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT
              a.house_id AS listing_id,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) IN ('pending','applied') THEN 1 ELSE 0 END) AS pending_count,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) = 'approved' THEN 1 ELSE 0 END) AS approved_count,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) = 'booked' THEN 1 ELSE 0 END) AS booked_count
            FROM dbo.APPLIEDHOUSERENTS a
            INNER JOIN dbo.HOUSERENTLISTINGS h ON h.house_id = a.house_id
            WHERE h.user_id = @user_id
            GROUP BY a.house_id
          `),
      ]);

      return mapListingsWithApplications(
        listingsResult.recordset || [],
        applicantsResult.recordset || [],
        countsResult.recordset || [],
      );
    };

    const loadMarketplaceListings = async () => {
      const [listingsResult, applicantsResult, countsResult] = await Promise.all([
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT m.item_id AS listing_id, m.title AS location, m.price AS rent, NULL AS preference, 'marketplace' AS [type], m.status, m.created_at, 'marketplace' AS listing_type
            FROM dbo.MARKETPLACELISTINGS m
            WHERE m.user_id = @user_id
          `),
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT a.item_id AS listing_id, a.user_id, a.status, a.applied_at, u.name AS applicant_name, u.email AS applicant_email
            FROM dbo.APPLIEDMARKETPLACE a
            INNER JOIN dbo.MARKETPLACELISTINGS m ON m.item_id = a.item_id
            INNER JOIN dbo.USERS u ON u.user_id = a.user_id
            WHERE m.user_id = @user_id
              AND LOWER(ISNULL(a.status, 'pending')) IN ('approved', 'booked')
          `),
        pool.request()
          .input('user_id', sql.UniqueIdentifier, userId)
          .query(`
            SELECT
              a.item_id AS listing_id,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) IN ('pending','applied') THEN 1 ELSE 0 END) AS pending_count,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) = 'approved' THEN 1 ELSE 0 END) AS approved_count,
              SUM(CASE WHEN LOWER(ISNULL(a.status, 'pending')) = 'booked' THEN 1 ELSE 0 END) AS booked_count
            FROM dbo.APPLIEDMARKETPLACE a
            INNER JOIN dbo.MARKETPLACELISTINGS m ON m.item_id = a.item_id
            WHERE m.user_id = @user_id
            GROUP BY a.item_id
          `),
      ]);

      return mapListingsWithApplications(
        listingsResult.recordset || [],
        applicantsResult.recordset || [],
        countsResult.recordset || [],
      );
    };

    const settledListings = await Promise.allSettled([
      loadRoommateListings(),
      loadTuitionListings(),
      loadMaidListings(),
      loadHouseListings(),
      loadMarketplaceListings(),
    ]);

    const myListings = settledListings
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => result.value);

    const overview = result.recordsets?.[0]?.[0] || {};
    const requestStatuses = result.recordsets?.[1] || [];
    const subscriptionData = result.recordsets?.[2]?.[0] || null;

    const myAppliedListings = (requestStatuses || []).filter((row) => {
      const status = String(row?.status || '').toLowerCase();
      return ['pending', 'applied', 'approved', 'booked'].includes(status);
    });

    const myListingsSummary = (myListings || []).map((listing) => ({
      listing_id: listing.listing_id,
      listing_type: listing.listing_type,
      title: listing.location,
      status: listing.status,
      pending_count: Number(listing.applicationCounts?.pending_count || 0),
      approved_count: Number(listing.applicationCounts?.approved_count || 0),
      booked_count: Number(listing.applicationCounts?.booked_count || 0),
    }));

    return res.json({
      overview,
      requestStatuses,
      myAppliedListings,
      subscriptionStatus: subscriptionData?.subscription_status || 'inactive',
      isSubscribed: subscriptionData?.subscription_status === 'active' || Number(subscriptionData?.subscription_active || 0) === 1,
      myListingsWithApprovedApplicants: myListings,
      myListingsSummary,
    });
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to load student dashboard', error: String(error.message || error) });
  }
});

router.get('/announcements', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT a.announcement_id, a.title, a.message, a.created_at, a.created_by, u.name AS created_by_name
      FROM dbo.ANNOUNCEMENTS a
      LEFT JOIN dbo.USERS u ON u.user_id = a.created_by
      ORDER BY a.created_at DESC;
    `);
    return res.json(result.recordset || []);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to load announcements', error: String(error.message || error) });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const pool = await getPool();
    try {
      const result = await pool
        .request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          SELECT user_id, name, email, role, subscription_active, created_at
          FROM dbo.USERS
          WHERE user_id = @user_id;
        `);

      return res.json(result.recordset[0] || null);
    } catch {
      // Fallback for older schemas where subscription_active may not exist.
      const fallback = await pool
        .request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          SELECT user_id, name, email, role, created_at
          FROM dbo.USERS
          WHERE user_id = @user_id;
        `);

      const row = fallback.recordset?.[0] || null;
      return res.json(row ? { ...row, subscription_active: false } : null);
    }
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to load profile', error: String(error.message || error) });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { name, email } = req.body;
    const pool = await getPool();

    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('name', sql.NVarChar(120), name)
      .input('email', sql.NVarChar(180), String(email || '').toLowerCase())
      .query(`
        UPDATE dbo.USERS
        SET name = @name,
            email = @email
        OUTPUT INSERTED.user_id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.subscription_active
        WHERE user_id = @user_id;
      `);

    await logActivity(pool, userId, 'profile_updated', 'USERS', userId);
    return res.json(result.recordset[0] || null);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to update profile', error: String(error.message || error) });
  }
});

router.post('/profile/change-password', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ msg: 'oldPassword and newPassword are required.' });
    }

    const pool = await getPool();
    const existing = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query('SELECT password_hash FROM dbo.USERS WHERE user_id = @user_id;');

    const hash = existing.recordset[0]?.password_hash;
    if (!hash) return res.status(404).json({ msg: 'User not found.' });

    const ok = await bcrypt.compare(oldPassword, hash);
    if (!ok) return res.status(400).json({ msg: 'Old password does not match.' });

    const nextHash = await bcrypt.hash(newPassword, 10);
    await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('password_hash', sql.NVarChar(255), nextHash)
      .query('UPDATE dbo.USERS SET password_hash = @password_hash WHERE user_id = @user_id;');

    await logActivity(pool, userId, 'password_changed', 'USERS', userId);
    return res.json({ msg: 'Password changed successfully.' });
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to change password', error: String(error.message || error) });
  }
});

router.get('/tuitions', async (_req, res) => {
  try {
    const userId = getAuthUserId(_req);
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
      SELECT t.tuition_id, t.subject, t.salary, t.location, t.status, t.is_locked, t.created_at, u.name AS owner_name
      FROM dbo.TUITIONS t
      INNER JOIN dbo.USERS u ON u.user_id = t.user_id
      WHERE ISNULL(t.is_listed, 0) = 1
        AND LOWER(ISNULL(t.status, 'approved')) IN ('approved', 'booked')
        AND (
          ISNULL(t.is_locked, 0) = 0
          OR EXISTS (
            SELECT 1 FROM dbo.APPLIEDTUITIONS a
            WHERE a.tuition_id = t.tuition_id
              AND a.user_id = @user_id
              AND LOWER(ISNULL(a.status, 'pending')) IN ('pending', 'approved')
          )
        )
      ORDER BY t.created_at DESC;
    `);

    const appliedResult = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
        SELECT tuition_id, status
        FROM dbo.APPLIEDTUITIONS
        WHERE user_id = @user_id;
      `);

    const appliedMap = {};
    for (const row of (appliedResult.recordset || []).sort((a, b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0))) {
      if (!appliedMap[row.tuition_id]) {
        appliedMap[row.tuition_id] = row.status;
      }
    }

    const rows = (result.recordset || []).map((row) => ({
      ...row,
      userApplicationStatus: appliedMap[row.tuition_id] || null,
    }));

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to fetch approved tuitions', error: String(error.message || error) });
  }
});

router.post('/tuitions/:tuitionId/apply', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { tuitionId } = req.params;
    const pool = await getPool();
    const subscribed = await hasActiveSubscription(pool, userId);
    if (!subscribed) {
      return res.status(403).json({ msg: 'Subscription required to apply for listings.' });
    }
    const proc = await pool
      .request()
      .input('p_user_id', sql.UniqueIdentifier, userId)
      .input('p_tuition_id', sql.UniqueIdentifier, tuitionId)
      .execute('dbo.sp_submit_tuition_application');

    const payload = proc.recordset?.[0] || {};
    if (Number(payload.status_code) !== 0) {
      return res.status(400).json(payload);
    }
    return res.status(201).json(payload);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to apply for tuition', error: String(error.message || error) });
  }
});

router.get('/maids', async (_req, res) => {
  try {
    const userId = getAuthUserId(_req);
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
      SELECT m.maid_id, m.salary, m.location, m.availability, ISNULL(m.status, 'Approved') AS status, m.is_locked, m.created_at, u.name AS owner_name
      FROM dbo.MAIDS m
      INNER JOIN dbo.USERS u ON u.user_id = m.user_id
      WHERE ISNULL(m.is_listed, 0) = 1
        AND LOWER(ISNULL(m.status, 'approved')) IN ('approved', 'booked')
        AND (
          ISNULL(m.is_locked, 0) = 0
          OR EXISTS (
            SELECT 1 FROM dbo.APPLIEDMAIDS a
            WHERE a.maid_id = m.maid_id
              AND a.user_id = @user_id
              AND LOWER(ISNULL(a.status, 'pending')) IN ('pending', 'approved')
          )
        )
      ORDER BY m.created_at DESC;
    `);

    const appliedResult = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
        SELECT maid_id, status
        FROM dbo.APPLIEDMAIDS
        WHERE user_id = @user_id;
      `);

    const appliedMap = {};
    for (const row of (appliedResult.recordset || []).sort((a, b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0))) {
      if (!appliedMap[row.maid_id]) {
        appliedMap[row.maid_id] = row.status;
      }
    }

    const rows = (result.recordset || []).map((row) => ({
      ...row,
      userApplicationStatus: appliedMap[row.maid_id] || null,
    }));

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to fetch maid listings', error: String(error.message || error) });
  }
});

router.post('/maids/:maidId/apply', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { maidId } = req.params;
    const pool = await getPool();
    const subscribed = await hasActiveSubscription(pool, userId);
    if (!subscribed) {
      return res.status(403).json({ msg: 'Subscription required to apply for listings.' });
    }

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const listing = await createRequest(tx)
        .input('maid_id', sql.UniqueIdentifier, maidId)
        .query(`
          SELECT TOP 1 maid_id, user_id, is_locked
          FROM dbo.MAIDS WITH (UPDLOCK, HOLDLOCK)
          WHERE maid_id = @maid_id;
        `);

      const current = listing.recordset[0];
      if (!current) {
        await tx.rollback();
        return res.status(404).json({ msg: 'Maid listing not found.' });
      }

      if (String(current.user_id) === String(userId)) {
        await tx.rollback();
        return res.status(400).json({ msg: 'You cannot apply to your own listing.' });
      }

      const existing = await createRequest(tx)
        .input('maid_id', sql.UniqueIdentifier, maidId)
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          SELECT TOP 1 application_id
          FROM dbo.APPLIEDMAIDS
          WHERE maid_id = @maid_id
            AND user_id = @user_id
            AND LOWER(ISNULL(status, 'pending')) IN ('pending', 'approved')
          ORDER BY applied_at DESC;
        `);

      if (existing.recordset[0]) {
        await tx.rollback();
        return res.status(409).json({ msg: 'You already have an active request for this maid listing.' });
      }

      if (Number(current.is_locked || 0) === 1) {
        await tx.rollback();
        return res.status(409).json({ msg: 'This maid listing is currently locked.' });
      }

      await createRequest(tx)
        .input('maid_id', sql.UniqueIdentifier, maidId)
        .query(`UPDATE dbo.MAIDS SET is_locked = 1 WHERE maid_id = @maid_id;`);

      const result = await createRequest(tx)
        .input('maid_id', sql.UniqueIdentifier, maidId)
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          INSERT INTO dbo.APPLIEDMAIDS (maid_id, user_id, status)
          OUTPUT INSERTED.application_id, INSERTED.maid_id, INSERTED.user_id, INSERTED.status, INSERTED.applied_at
          VALUES (@maid_id, @user_id, 'pending');
        `);

      await logActivity(tx, userId, 'applied_maid', 'APPLIEDMAIDS', result.recordset[0]?.application_id || null);
      await tx.commit();
      return res.status(201).json(result.recordset[0]);
    } catch (error) {
      if (tx._aborted !== true) await tx.rollback();
      throw error;
    }
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to apply for maid service', error: String(error.message || error) });
  }
});

router.get('/roommates', async (_req, res) => {
  try {
    const userId = getAuthUserId(_req);
    const pool = await getPool();
    // Try strict listing policy first.
    let listingsResult = await pool.request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
      SELECT r.listing_id, r.location, r.rent, r.preference, r.[type], ISNULL(r.status, 'Approved') AS status, r.is_locked, r.created_at, u.name AS owner_name,
             CASE WHEN r.user_id = @user_id THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS is_own
      FROM dbo.ROOMMATELISTINGS r
      INNER JOIN dbo.USERS u ON u.user_id = r.user_id
      WHERE ISNULL(r.is_listed, 0) = 1
        AND LOWER(ISNULL(r.status, 'approved')) IN ('approved', 'booked')
        AND (
          ISNULL(r.is_locked, 0) = 0
          OR r.user_id = @user_id
          OR EXISTS (
            SELECT 1 FROM dbo.APPLIEDROOMMATES a
            WHERE a.listing_id = r.listing_id
              AND a.user_id = @user_id
              AND LOWER(ISNULL(a.status, 'pending')) IN ('pending', 'approved')
          )
        )
      ORDER BY r.created_at DESC;
    `);

    // Backward-compatible fallback: older data may not have is_listed populated.
    if (!Array.isArray(listingsResult.recordset) || listingsResult.recordset.length === 0) {
      listingsResult = await pool.request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          SELECT r.listing_id, r.location, r.rent, r.preference, r.[type], ISNULL(r.status, 'Approved') AS status,
                 CAST(0 AS BIT) AS is_locked, r.created_at, u.name AS owner_name,
                 CASE WHEN r.user_id = @user_id THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS is_own
          FROM dbo.ROOMMATELISTINGS r
          INNER JOIN dbo.USERS u ON u.user_id = r.user_id
          WHERE LOWER(ISNULL(r.status, 'approved')) IN ('approved', 'booked', 'open', 'pending')
          ORDER BY r.created_at DESC;
        `);
    }

    const listings = listingsResult.recordset || [];

    // Get all applications by this user
    const appliedResult = await pool.request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
        SELECT listing_id, status, applied_at
        FROM dbo.APPLIEDROOMMATES
        WHERE user_id = @user_id
      `);
    const appliedMap = {};
    for (const row of (appliedResult.recordset || []).sort((a, b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0))) {
      if (!appliedMap[row.listing_id]) {
        appliedMap[row.listing_id] = row.status;
      }
    }

    // Attach user-specific application status
    const listingsWithUserStatus = listings.map(l => ({
      ...l,
      userApplicationStatus: appliedMap[l.listing_id] || null
    }));

    return res.json(listingsWithUserStatus);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to fetch roommate listings', error: String(error.message || error) });
  }
});

router.post('/roommates', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { location, rent, preference, type = 'host' } = req.body;
    const pool = await getPool();
    const subscribed = await hasActiveSubscription(pool, userId);
    if (!subscribed) {
      return res.status(403).json({ msg: 'Subscription required to create listings.' });
    }

    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('location', sql.NVarChar(160), location)
      .input('rent', sql.Decimal(10, 2), Number(rent || 0))
      .input('preference', sql.NVarChar(sql.MAX), preference || null)
      .input('type', sql.NVarChar(20), type)
      .query(`
        INSERT INTO dbo.ROOMMATELISTINGS (user_id, location, rent, preference, [type], status)
        OUTPUT INSERTED.listing_id, INSERTED.user_id, INSERTED.location, INSERTED.rent, INSERTED.preference, INSERTED.[type], INSERTED.status, INSERTED.created_at
        VALUES (@user_id, @location, @rent, @preference, @type, 'Pending');
      `);

    // Keep pending listings hidden from public browse until admin approval.
    await pool
      .request()
      .input('listing_id', sql.UniqueIdentifier, result.recordset[0]?.listing_id || null)
      .query(`
        IF @listing_id IS NOT NULL AND COL_LENGTH('dbo.ROOMMATELISTINGS', 'is_listed') IS NOT NULL
        BEGIN
          UPDATE dbo.ROOMMATELISTINGS
          SET is_listed = 0
          WHERE listing_id = @listing_id;
        END
      `);

    await logActivity(pool, userId, 'created_roommate_listing', 'ROOMMATELISTINGS', result.recordset[0]?.listing_id || null);
    return res.status(201).json(result.recordset[0]);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to create roommate listing', error: String(error.message || error) });
  }
});

router.post('/roommates/:listingId/apply', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { listingId } = req.params;
    const pool = await getPool();
    const subscribed = await hasActiveSubscription(pool, userId);
    if (!subscribed) {
      return res.status(403).json({ msg: 'Subscription required to apply for listings.' });
    }

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const listing = await createRequest(tx)
        .input('listing_id', sql.UniqueIdentifier, listingId)
        .query(`
          SELECT TOP 1 listing_id, user_id, is_locked
          FROM dbo.ROOMMATELISTINGS WITH (UPDLOCK, HOLDLOCK)
          WHERE listing_id = @listing_id;
        `);

      const current = listing.recordset[0];
      if (!current) {
        await tx.rollback();
        return res.status(404).json({ msg: 'Roommate listing not found.' });
      }

      if (String(current.user_id) === String(userId)) {
        await tx.rollback();
        return res.status(400).json({ msg: 'You cannot apply to your own listing.' });
      }

      const existing = await createRequest(tx)
        .input('listing_id', sql.UniqueIdentifier, listingId)
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          SELECT TOP 1 application_id
          FROM dbo.APPLIEDROOMMATES
          WHERE listing_id = @listing_id
            AND user_id = @user_id
            AND LOWER(ISNULL(status, 'pending')) IN ('pending', 'approved')
          ORDER BY applied_at DESC;
        `);

      if (existing.recordset[0]) {
        await tx.rollback();
        return res.status(409).json({ msg: 'You already have an active request for this listing.' });
      }

      if (Number(current.is_locked || 0) === 1) {
        await tx.rollback();
        return res.status(409).json({ msg: 'This roommate listing is currently locked.' });
      }

      await createRequest(tx)
        .input('listing_id', sql.UniqueIdentifier, listingId)
        .query(`UPDATE dbo.ROOMMATELISTINGS SET is_locked = 1 WHERE listing_id = @listing_id;`);

      const result = await createRequest(tx)
        .input('listing_id', sql.UniqueIdentifier, listingId)
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          INSERT INTO dbo.APPLIEDROOMMATES (listing_id, user_id, status)
          OUTPUT INSERTED.application_id, INSERTED.listing_id, INSERTED.user_id, INSERTED.status, INSERTED.applied_at
          VALUES (@listing_id, @user_id, 'pending');
        `);

      await logActivity(tx, userId, 'applied_roommate', 'APPLIEDROOMMATES', result.recordset[0]?.application_id || null);
      await tx.commit();
      return res.status(201).json(result.recordset[0]);
    } catch (error) {
      if (tx._aborted !== true) await tx.rollback();
      throw error;
    }
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to apply for roommate listing', error: String(error.message || error) });
  }
});

router.get('/house-rent', async (_req, res) => {
  try {
    const userId = getAuthUserId(_req);
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
      SELECT h.house_id, h.location, h.rent, h.rooms, h.description, ISNULL(h.status, 'Approved') AS status, h.is_locked, h.created_at, u.name AS owner_name
      FROM dbo.HOUSERENTLISTINGS h
      INNER JOIN dbo.USERS u ON u.user_id = h.user_id
      WHERE ISNULL(h.is_listed, 0) = 1
        AND LOWER(ISNULL(h.status, 'approved')) IN ('approved', 'booked')
        AND (
          ISNULL(h.is_locked, 0) = 0
          OR EXISTS (
            SELECT 1 FROM dbo.APPLIEDHOUSERENTS c
            WHERE c.house_id = h.house_id
              AND c.user_id = @user_id
              AND LOWER(ISNULL(c.status, 'pending')) IN ('pending', 'approved')
          )
        )
      ORDER BY h.created_at DESC;
    `);

    const appliedResult = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
        SELECT house_id, status, applied_at
        FROM dbo.APPLIEDHOUSERENTS
        WHERE user_id = @user_id
        ORDER BY applied_at DESC;
      `);

    const appliedMap = {};
    for (const row of (appliedResult.recordset || []).sort((a, b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0))) {
      if (!appliedMap[row.house_id]) {
        appliedMap[row.house_id] = row.status || 'pending';
      }
    }

    const rows = (result.recordset || []).map((row) => ({
      ...row,
      userApplicationStatus: appliedMap[row.house_id] || null,
    }));

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to fetch house rent listings', error: String(error.message || error) });
  }
});

router.post('/house-rent/contact', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { houseId, message } = req.body;
    const pool = await getPool();
    const subscribed = await hasActiveSubscription(pool, userId);
    if (!subscribed) {
      return res.status(403).json({ msg: 'Subscription required to apply for listings.' });
    }

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const listing = await createRequest(tx)
        .input('house_id', sql.UniqueIdentifier, houseId)
        .query(`
          SELECT TOP 1 house_id, user_id, is_locked
          FROM dbo.HOUSERENTLISTINGS WITH (UPDLOCK, HOLDLOCK)
          WHERE house_id = @house_id;
        `);

      const current = listing.recordset[0];
      if (!current) {
        await tx.rollback();
        return res.status(404).json({ msg: 'House rent listing not found.' });
      }

      if (String(current.user_id) === String(userId)) {
        await tx.rollback();
        return res.status(400).json({ msg: 'You cannot contact your own listing.' });
      }

      const existing = await createRequest(tx)
        .input('house_id', sql.UniqueIdentifier, houseId)
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          SELECT TOP 1 application_id
          FROM dbo.APPLIEDHOUSERENTS
          WHERE house_id = @house_id
            AND user_id = @user_id
            AND LOWER(ISNULL(status, 'pending')) IN ('pending', 'approved')
          ORDER BY applied_at DESC;
        `);

      if (existing.recordset[0]) {
        await tx.rollback();
        return res.status(409).json({ msg: 'You already have an active request for this listing.' });
      }

      if (Number(current.is_locked || 0) === 1) {
        await tx.rollback();
        return res.status(409).json({ msg: 'This house listing is currently locked.' });
      }

      await createRequest(tx)
        .input('house_id', sql.UniqueIdentifier, houseId)
        .query(`UPDATE dbo.HOUSERENTLISTINGS SET is_locked = 1 WHERE house_id = @house_id;`);

      const result = await createRequest(tx)
        .input('house_id', sql.UniqueIdentifier, houseId)
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          INSERT INTO dbo.APPLIEDHOUSERENTS (house_id, user_id, status)
          OUTPUT INSERTED.application_id, INSERTED.house_id, INSERTED.user_id, INSERTED.status, INSERTED.applied_at
          VALUES (@house_id, @user_id, 'pending');
        `);

      await logActivity(tx, userId, 'applied_house_rent', 'APPLIEDHOUSERENTS', result.recordset[0]?.application_id || null);
      await tx.commit();
      return res.status(201).json(result.recordset[0]);
    } catch (error) {
      if (tx._aborted !== true) await tx.rollback();
      throw error;
    }
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to contact house owner', error: String(error.message || error) });
  }
});

router.get('/marketplace', async (_req, res) => {
  try {
    const userId = getAuthUserId(_req);
    const pool = await getPool();
    await ensureMarketplaceApplicationsTable(pool);
    try {
      const result = await pool.request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
        SELECT
          m.item_id,
          m.user_id,
          u.name AS seller_name,
          m.title,
          m.price,
          m.[condition],
          m.status,
          m.created_at,
          CASE WHEN m.user_id = @user_id THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS is_own,
          ua.status AS userApplicationStatus
        FROM dbo.MARKETPLACELISTINGS m
        INNER JOIN dbo.USERS u ON u.user_id = m.user_id
        OUTER APPLY (
          SELECT TOP 1 a.status
          FROM dbo.APPLIEDMARKETPLACE a
          WHERE a.item_id = m.item_id
            AND a.user_id = @user_id
          ORDER BY a.applied_at DESC
        ) ua
        WHERE (
            LOWER(ISNULL(m.status, 'available')) IN ('available', 'approved')
            OR EXISTS (
              SELECT 1
              FROM dbo.APPLIEDMARKETPLACE a2
              WHERE a2.item_id = m.item_id
                AND a2.user_id = @user_id
                AND LOWER(ISNULL(a2.status, 'pending')) IN ('pending', 'approved', 'booked')
            )
          )
        ORDER BY m.created_at DESC;
      `);
      return res.json(result.recordset);
    } catch {
      // Fallback for older schemas where [condition] or status may be missing.
      const fallback = await pool.request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
        SELECT m.item_id, m.user_id, u.name AS seller_name, m.title, m.price,
               CAST(NULL AS NVARCHAR(40)) AS [condition],
               CAST('available' AS NVARCHAR(30)) AS status,
           CASE WHEN m.user_id = @user_id THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS is_own,
               CAST(NULL AS NVARCHAR(30)) AS userApplicationStatus,
               m.created_at
        FROM dbo.MARKETPLACELISTINGS m
        INNER JOIN dbo.USERS u ON u.user_id = m.user_id
        ORDER BY m.created_at DESC;
      `);
      return res.json(fallback.recordset);
    }
  } catch (error) {
    console.error('Marketplace fetch failed, returning empty list:', error?.message || error);
    // Degrade gracefully for any runtime DB issue so UI remains functional.
    return res.json([]);
  }
});

router.post('/marketplace', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { title, price, condition } = req.body;
    const pool = await getPool();
    const subscribed = await hasActiveSubscription(pool, userId);
    if (!subscribed) {
      return res.status(403).json({ msg: 'Subscription required to create listings.' });
    }

    let result;
    try {
      result = await pool
        .request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .input('title', sql.NVarChar(160), title)
        .input('price', sql.Decimal(10, 2), Number(price || 0))
        .input('condition', sql.NVarChar(40), condition || 'used')
        .query(`
          DECLARE @inserted TABLE (
            item_id UNIQUEIDENTIFIER,
            user_id UNIQUEIDENTIFIER,
            title NVARCHAR(160),
            price DECIMAL(10,2),
            [condition] NVARCHAR(40),
            status NVARCHAR(30),
            created_at DATETIME2
          );

          INSERT INTO dbo.MARKETPLACELISTINGS (user_id, title, price, [condition], status)
          OUTPUT INSERTED.item_id, INSERTED.user_id, INSERTED.title, INSERTED.price, INSERTED.[condition], INSERTED.status, INSERTED.created_at
          INTO @inserted
          VALUES (@user_id, @title, @price, @condition, 'pending');

          SELECT * FROM @inserted;
        `);
    } catch {
      // Fallback for older schemas without condition/status columns.
      result = await pool
        .request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .input('title', sql.NVarChar(160), title)
        .input('price', sql.Decimal(10, 2), Number(price || 0))
        .query(`
          DECLARE @inserted TABLE (
            item_id UNIQUEIDENTIFIER,
            user_id UNIQUEIDENTIFIER,
            title NVARCHAR(160),
            price DECIMAL(10,2),
            created_at DATETIME2
          );

          INSERT INTO dbo.MARKETPLACELISTINGS (user_id, title, price)
          OUTPUT INSERTED.item_id, INSERTED.user_id, INSERTED.title, INSERTED.price, INSERTED.created_at
          INTO @inserted
          VALUES (@user_id, @title, @price);

          SELECT item_id, user_id, title, price,
                 CAST(NULL AS NVARCHAR(40)) AS [condition],
                 CAST('available' AS NVARCHAR(30)) AS status,
                 created_at
          FROM @inserted;
        `);
    }

    await logActivity(pool, userId, 'created_marketplace_item', 'MARKETPLACELISTINGS', result.recordset[0]?.item_id || null);
    return res.status(201).json(result.recordset[0]);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to create marketplace item', error: String(error.message || error) });
  }
});

async function submitMarketplaceApplication(req, res) {
  try {
    const userId = getAuthUserId(req);
    const { itemId } = req.params;
    const pool = await getPool();
    const subscribed = await hasActiveSubscription(pool, userId);
    if (!subscribed) {
      return res.status(403).json({ msg: 'Subscription required to apply for listings.' });
    }

    await ensureMarketplaceApplicationsTable(pool);

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const listing = await createRequest(tx)
        .input('item_id', sql.UniqueIdentifier, itemId)
        .query(`
          SELECT TOP 1 item_id, user_id, status
          FROM dbo.MARKETPLACELISTINGS WITH (UPDLOCK, HOLDLOCK)
          WHERE item_id = @item_id;
        `);

      const current = listing.recordset[0];
      if (!current) {
        await tx.rollback();
        return res.status(404).json({ msg: 'Marketplace item not found.' });
      }

      if (String(current.user_id) === String(userId)) {
        await tx.rollback();
        return res.status(400).json({ msg: 'You cannot apply to your own marketplace listing.' });
      }

      const listingStatus = String(current.status || '').toLowerCase();
      if (!['approved', 'available'].includes(listingStatus)) {
        await tx.rollback();
        return res.status(409).json({ msg: 'This marketplace item is not open for applications.' });
      }

      const existing = await createRequest(tx)
        .input('item_id', sql.UniqueIdentifier, itemId)
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          SELECT TOP 1 application_id
          FROM dbo.APPLIEDMARKETPLACE
          WHERE item_id = @item_id
            AND user_id = @user_id
            AND LOWER(ISNULL(status, 'pending')) IN ('pending', 'approved')
          ORDER BY applied_at DESC;
        `);

      if (existing.recordset[0]) {
        await tx.rollback();
        return res.status(409).json({ msg: 'You already have an active request for this item.' });
      }

      const result = await createRequest(tx)
        .input('item_id', sql.UniqueIdentifier, itemId)
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          INSERT INTO dbo.APPLIEDMARKETPLACE (item_id, user_id, status)
          OUTPUT INSERTED.application_id, INSERTED.item_id, INSERTED.user_id, INSERTED.status, INSERTED.applied_at
          VALUES (@item_id, @user_id, 'pending');
        `);

      await logActivity(tx, userId, 'applied_marketplace', 'APPLIEDMARKETPLACE', result.recordset[0]?.application_id || null);
      await tx.commit();
      return res.status(201).json(result.recordset[0]);
    } catch (innerError) {
      if (tx._aborted !== true) await tx.rollback();
      throw innerError;
    }
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to apply for marketplace item', error: String(error.message || error) });
  }
}

router.post('/marketplace/:itemId/buy', submitMarketplaceApplication);

router.post('/marketplace/:itemId/apply', async (req, res) => {
  return submitMarketplaceApplication(req, res);
});

router.post('/subscription/pay', async (req, res) => {
  try {
    const pool = await getPool();
    const resolvedUserId = await ensureSqlUserExists(pool, {
      userId: getAuthUserId(req) || req.body.userId || req.body.user_id,
      email: req.body.email,
      name: req.body.name,
      fullName: req.body.fullName,
      role: req.body.role,
    });
    if (!resolvedUserId) {
      return res.status(401).json({ msg: 'Authentication required.' });
    }
    const amount = Number(req.body.amount || 99);
    const bkashNumber = String(req.body.bkashNumber || '').trim();
    const txReference = String(req.body.reference || req.body.paymentRef || '').trim();
    if (!/^01\d{9}$/.test(bkashNumber)) {
      return res.status(400).json({ msg: 'BKash number must be 11 digits and start with 01.' });
    }
    if (!txReference) {
      return res.status(400).json({ msg: 'Transaction reference is required.' });
    }
    const paymentRef = [
      bkashNumber ? `BKASH:${bkashNumber}` : null,
      txReference ? `REF:${txReference}` : null,
    ].filter(Boolean).join('|') || null;
    // Insert subscription payment record
    const paymentResult = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, resolvedUserId)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('status', sql.NVarChar(30), 'paid')
      .input('payment_ref', sql.NVarChar(50), paymentRef)
      .query(`
        DECLARE @inserted TABLE (
          payment_id UNIQUEIDENTIFIER,
          user_id UNIQUEIDENTIFIER,
          amount DECIMAL(10, 2),
          status NVARCHAR(30),
          payment_date DATETIME2
        );

        INSERT INTO dbo.SUBSCRIPTIONPAYMENTS (user_id, amount, status, payment_ref)
        OUTPUT INSERTED.payment_id, INSERTED.user_id, INSERTED.amount, INSERTED.status, INSERTED.payment_date INTO @inserted
        VALUES (@user_id, @amount, @status, @payment_ref);

        SELECT * FROM @inserted;
      `);

    const payment = paymentResult.recordset?.[0];

    await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, resolvedUserId)
      .query(`
        UPDATE dbo.USERS
        SET subscription_active = 1
        WHERE user_id = @user_id;
      `);

    // Log activity
    await logActivity(pool, resolvedUserId, 'subscription_payment', 'SUBSCRIPTIONPAYMENTS', payment?.payment_id || null);

    return res.status(201).json({
      msg: 'Subscription payment processed successfully',
      payment: {
        id: payment?.payment_id,
        amount: payment?.amount,
        status: payment?.status,
        paymentDate: payment?.payment_date,
      }
    });
  } catch (error) {
    console.error('Subscription payment failed:', error);
    return res.status(500).json({ msg: 'Failed to process subscription payment', error: String(error.message || error) });
  }
});

router.post('/subscription/unsubscribe', async (req, res) => {
  try {
    const pool = await getPool();
    const resolvedUserId = await ensureSqlUserExists(pool, {
      userId: getAuthUserId(req) || req.body.userId || req.body.user_id,
      email: req.body.email,
      name: req.body.name,
      fullName: req.body.fullName,
      role: req.body.role,
    });
    if (!resolvedUserId) {
      return res.status(401).json({ msg: 'Authentication required.' });
    }

    const latestPaid = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, resolvedUserId)
      .query(`
        SELECT TOP 1 payment_id, amount
        FROM dbo.SUBSCRIPTIONPAYMENTS
        WHERE user_id = @user_id AND LOWER(status) = 'paid'
        ORDER BY payment_date DESC;
      `);

    const amount = Number(latestPaid.recordset?.[0]?.amount || 99);

    const unsubResult = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, resolvedUserId)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('status', sql.NVarChar(30), 'refunded')
      .input('payment_ref', sql.NVarChar(50), 'UNSUBSCRIBED')
      .query(`
        DECLARE @inserted TABLE (
          payment_id UNIQUEIDENTIFIER
        );

        INSERT INTO dbo.SUBSCRIPTIONPAYMENTS (user_id, amount, status, payment_ref)
        OUTPUT INSERTED.payment_id INTO @inserted
        VALUES (@user_id, @amount, @status, @payment_ref);

        SELECT * FROM @inserted;
      `);

    await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, resolvedUserId)
      .query(`
        UPDATE dbo.USERS
        SET subscription_active = 0
        WHERE user_id = @user_id;
      `);

    await logActivity(pool, resolvedUserId, 'subscription_unsubscribed', 'SUBSCRIPTIONPAYMENTS', unsubResult.recordset?.[0]?.payment_id || null);

    return res.json({ msg: 'Unsubscribed successfully.' });
  } catch (error) {
    console.error('Unsubscribe failed:', error);
    return res.status(500).json({ msg: 'Failed to unsubscribe', error: String(error.message || error) });
  }
});

router.post('/maids/applications/:applicationId/book', async (req, res) => {
  try {
    const actorId = getAuthUserId(req);
    const { applicationId } = req.params;
    const pool = await getPool();

    const proc = await pool
      .request()
      .input('p_application_id', sql.UniqueIdentifier, applicationId)
      .input('p_actor_user_id', sql.UniqueIdentifier, actorId)
      .execute('dbo.sp_process_maid_booking');

    const payload = proc.recordset?.[0] || {};
    if (Number(payload.status_code) !== 0) {
      return res.status(400).json(payload);
    }
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to process maid booking', error: String(error.message || error) });
  }
});

router.post('/roommates/applications/:applicationId/book', async (req, res) => {
  try {
    const actorId = getAuthUserId(req);
    const { applicationId } = req.params;
    const pool = await getPool();

    const proc = await pool
      .request()
      .input('p_application_id', sql.UniqueIdentifier, applicationId)
      .input('p_actor_user_id', sql.UniqueIdentifier, actorId)
      .execute('dbo.sp_process_roommate_booking');

    const payload = proc.recordset?.[0] || {};
    if (Number(payload.status_code) !== 0) {
      return res.status(400).json(payload);
    }
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to process roommate booking', error: String(error.message || error) });
  }
});

router.get('/activities', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const pool = await getPool();
    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
        SELECT activity_id, action_type, reference_table, reference_id, [timestamp]
        FROM dbo.USERACTIVITIES
        WHERE user_id = @user_id
        ORDER BY [timestamp] DESC;
      `);

    return res.json(result.recordset);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to load personal activity', error: String(error.message || error) });
  }
});

export default router;
