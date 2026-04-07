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
      SELECT TOP 1 status
      FROM dbo.SUBSCRIPTIONPAYMENTS
      WHERE user_id = @user_id
      ORDER BY payment_date DESC;
    `);

  const latest = String(check.recordset?.[0]?.status || '').toLowerCase();
  return latest === 'paid';
}

router.get('/dashboard', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const pool = await getPool();

    // Overview and request statuses
    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
        SELECT
          @user_id AS user_id,
          (SELECT COUNT(*) FROM dbo.APPLIEDTUITIONS WHERE user_id = @user_id) AS total_applications,
          (SELECT COUNT(*) FROM dbo.TUITIONS WHERE user_id = @user_id)
            + (SELECT COUNT(*) FROM dbo.ROOMMATELISTINGS WHERE user_id = @user_id) AS total_listings,
          (SELECT ISNULL(SUM(amount), 0) FROM dbo.SUBSCRIPTIONPAYMENTS WHERE user_id = @user_id AND status = 'paid') AS total_payments;

        SELECT TOP 50 'roommate' AS module, application_id, listing_title, status, applied_at
        FROM (
          SELECT
            a.application_id,
            CONCAT('Roommate - ', r.location) AS listing_title,
            a.status,
            a.applied_at
          FROM dbo.APPLIEDROOMMATES a
          INNER JOIN dbo.ROOMMATELISTINGS r ON r.listing_id = a.listing_id
          WHERE a.user_id = @user_id
        ) req
        ORDER BY applied_at DESC;

        SELECT TOP 1 
          CASE 
            WHEN status = 'paid' THEN 'active'
            ELSE 'inactive'
          END AS subscription_status
        FROM dbo.SUBSCRIPTIONPAYMENTS
        WHERE user_id = @user_id
        ORDER BY payment_date DESC;
      `);

    // Fetch all user's listings with approved applicants
    const myListings = [];

    try {
      // Roommate listings
      const roommateResult = await pool.request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          SELECT r.listing_id, r.location, r.rent, r.preference, r.[type], r.status, r.created_at, 'roommate' AS listing_type
          FROM dbo.ROOMMATELISTINGS r
          WHERE r.user_id = @user_id
        `);

      if (roommateResult.recordset && Array.isArray(roommateResult.recordset)) {
        for (const listing of roommateResult.recordset) {
          const appResult = await pool.request()
            .input('listing_id', sql.UniqueIdentifier, listing.listing_id)
            .query(`
              SELECT a.user_id, a.status, a.applied_at, u.name AS applicant_name, u.email AS applicant_email
              FROM dbo.APPLIEDROOMMATES a
              INNER JOIN dbo.USERS u ON u.user_id = a.user_id
              WHERE a.status = 'Approved' AND a.listing_id = @listing_id
            `);

          myListings.push({
            ...listing,
            approvedApplicants: appResult.recordset || []
          });
        }
      }
    } catch (err) {
      console.error('Error fetching roommate listings:', err.message);
    }

    try {
      // Tuition listings
      const tuitionResult = await pool.request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          SELECT t.tuition_id AS listing_id, t.subject AS location, t.salary AS rent, NULL AS preference, 'tuition' AS [type], t.status, t.created_at, 'tuition' AS listing_type
          FROM dbo.TUITIONS t
          WHERE t.user_id = @user_id
        `);

      if (tuitionResult.recordset && Array.isArray(tuitionResult.recordset)) {
        for (const listing of tuitionResult.recordset) {
          const appResult = await pool.request()
            .input('tuition_id', sql.UniqueIdentifier, listing.listing_id)
            .query(`
              SELECT a.user_id, a.status, a.applied_at, u.name AS applicant_name, u.email AS applicant_email
              FROM dbo.APPLIEDTUITIONS a
              INNER JOIN dbo.USERS u ON u.user_id = a.user_id
              WHERE a.status = 'Approved' AND a.tuition_id = @tuition_id
            `);

          myListings.push({
            ...listing,
            approvedApplicants: appResult.recordset || []
          });
        }
      }
    } catch (err) {
      console.error('Error fetching tuition listings:', err.message);
    }

    try {
      // Maid listings
      const maidResult = await pool.request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          SELECT m.maid_id AS listing_id, m.location, m.salary AS rent, NULL AS preference, 'maid' AS [type], ISNULL(m.status, 'Approved') AS status, m.created_at, 'maid' AS listing_type
          FROM dbo.MAIDS m
          WHERE m.user_id = @user_id
        `);

      if (maidResult.recordset && Array.isArray(maidResult.recordset)) {
        for (const listing of maidResult.recordset) {
          const appResult = await pool.request()
            .input('maid_id', sql.UniqueIdentifier, listing.listing_id)
            .query(`
              SELECT a.user_id, a.status, a.applied_at, u.name AS applicant_name, u.email AS applicant_email
              FROM dbo.APPLIEDMAIDS a
              INNER JOIN dbo.USERS u ON u.user_id = a.user_id
              WHERE a.status = 'Approved' AND a.maid_id = @maid_id
            `);

          myListings.push({
            ...listing,
            approvedApplicants: appResult.recordset || []
          });
        }
      }
    } catch (err) {
      console.error('Error fetching maid listings:', err.message);
    }

    try {
      // House rent listings
      const houseResult = await pool.request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          SELECT h.house_id AS listing_id, h.location, h.rent, NULL AS preference, 'house' AS [type], ISNULL(h.status, 'Approved') AS status, h.created_at, 'house' AS listing_type
          FROM dbo.HOUSERENTLISTINGS h
          WHERE h.user_id = @user_id
        `);

      if (houseResult.recordset && Array.isArray(houseResult.recordset)) {
        for (const listing of houseResult.recordset) {
          const appResult = await pool.request()
            .input('house_id', sql.UniqueIdentifier, listing.listing_id)
            .query(`
              SELECT a.user_id, a.status, a.applied_at, u.name AS applicant_name, u.email AS applicant_email
              FROM dbo.APPLIEDHOUSERENTS a
              INNER JOIN dbo.USERS u ON u.user_id = a.user_id
              WHERE a.house_id = @house_id
            `);

          myListings.push({
            ...listing,
            approvedApplicants: appResult.recordset || []
          });
        }
      }
    } catch (err) {
      console.error('Error fetching house rent listings:', err.message);
    }

    try {
      // Marketplace listings
      const marketplaceResult = await pool.request()
        .input('user_id', sql.UniqueIdentifier, userId)
        .query(`
          SELECT m.item_id AS listing_id, m.title AS location, m.price AS rent, NULL AS preference, 'marketplace' AS [type], m.status, m.created_at, 'marketplace' AS listing_type
          FROM dbo.MARKETPLACELISTINGS m
          WHERE m.user_id = @user_id
        `);

      if (marketplaceResult.recordset && Array.isArray(marketplaceResult.recordset)) {
        myListings.push(...marketplaceResult.recordset.map(listing => ({
          ...listing,
          approvedApplicants: []
        })));
      }
    } catch (err) {
      console.error('Error fetching marketplace listings:', err.message);
    }

    const overview = result.recordsets?.[0]?.[0] || {};
    const requestStatuses = result.recordsets?.[1] || [];
    const subscriptionData = result.recordsets?.[2]?.[0] || null;

    return res.json({
      overview,
      requestStatuses,
      subscriptionStatus: subscriptionData?.subscription_status || 'inactive',
      isSubscribed: subscriptionData?.subscription_status === 'active',
      myListingsWithApprovedApplicants: myListings,
    });
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to load student dashboard', error: String(error.message || error) });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const pool = await getPool();
    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
        SELECT user_id, name, email, role, subscription_active, created_at
        FROM dbo.USERS
        WHERE user_id = @user_id;
      `);

    return res.json(result.recordset[0] || null);
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
    // Get all listings
    const listingsResult = await pool.request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
      SELECT r.listing_id, r.location, r.rent, r.preference, r.[type], ISNULL(r.status, 'Approved') AS status, r.is_locked, r.created_at, u.name AS owner_name
      FROM dbo.ROOMMATELISTINGS r
      INNER JOIN dbo.USERS u ON u.user_id = r.user_id
      WHERE ISNULL(r.is_listed, 0) = 1
        AND LOWER(ISNULL(r.status, 'approved')) IN ('approved', 'booked')
        AND (
          ISNULL(r.is_locked, 0) = 0
          OR EXISTS (
            SELECT 1 FROM dbo.APPLIEDROOMMATES a
            WHERE a.listing_id = r.listing_id
              AND a.user_id = @user_id
              AND LOWER(ISNULL(a.status, 'pending')) IN ('pending', 'approved')
          )
        )
      ORDER BY r.created_at DESC;
    `);
    const listings = listingsResult.recordset;

    // Get all applications by this user
    const appliedResult = await pool.request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(`
        SELECT listing_id, status FROM dbo.APPLIEDROOMMATES WHERE user_id = @user_id
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
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT m.item_id, m.user_id, u.name AS seller_name, m.title, m.price, m.[condition], m.status, m.created_at
      FROM dbo.MARKETPLACELISTINGS m
      INNER JOIN dbo.USERS u ON u.user_id = m.user_id
      WHERE LOWER(ISNULL(m.status, 'available')) IN ('available', 'approved', 'pending')
      ORDER BY m.created_at DESC;
    `);
    return res.json(result.recordset);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to fetch marketplace listings', error: String(error.message || error) });
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

    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('title', sql.NVarChar(160), title)
      .input('price', sql.Decimal(10, 2), Number(price || 0))
      .input('condition', sql.NVarChar(40), condition || 'used')
      .query(`
        INSERT INTO dbo.MARKETPLACELISTINGS (user_id, title, price, [condition], status)
        OUTPUT INSERTED.item_id, INSERTED.user_id, INSERTED.title, INSERTED.price, INSERTED.[condition], INSERTED.status, INSERTED.created_at
        VALUES (@user_id, @title, @price, @condition, 'pending');
      `);

    await logActivity(pool, userId, 'created_marketplace_item', 'MARKETPLACELISTINGS', result.recordset[0]?.item_id || null);
    return res.status(201).json(result.recordset[0]);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to create marketplace item', error: String(error.message || error) });
  }
});

router.post('/marketplace/:itemId/buy', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { itemId } = req.params;
    const pool = await getPool();
    const subscribed = await hasActiveSubscription(pool, userId);
    if (!subscribed) {
      return res.status(403).json({ msg: 'Subscription required to apply for listings.' });
    }
    const proc = await pool
      .request()
      .input('p_item_id', sql.UniqueIdentifier, itemId)
      .input('p_buyer_user_id', sql.UniqueIdentifier, userId)
      .execute('dbo.sp_marketplace_purchase_transaction');

    const payload = proc.recordset?.[0] || {};
    if (Number(payload.status_code) !== 0) {
      return res.status(400).json(payload);
    }
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to buy item', error: String(error.message || error) });
  }
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
