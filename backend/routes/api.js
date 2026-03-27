import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createRequest, getPool, sql } from '../db/connection.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

function normalizeUser(row) {
  if (!row) return null;
  return {
    _id: row.user_id,
    id: row.user_id,
    user_id: row.user_id,
    fullName: row.name,
    name: row.name,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
  };
}

async function logActivity(poolOrTx, userId, actionType, referenceTable, referenceId = null) {
  if (!userId) return;
  const req = createRequest(poolOrTx)
    .input('user_id', sql.UniqueIdentifier, userId)
    .input('action_type', sql.NVarChar(80), actionType)
    .input('reference_table', sql.NVarChar(60), referenceTable)
    .input('reference_id', sql.UniqueIdentifier, referenceId);
  await req.query(`
    INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
    VALUES (@user_id, @action_type, @reference_table, @reference_id)
  `);
}

function extractUserId(req) {
  return (
    req.body.userId ||
    req.body.user_id ||
    req.body.applicantId ||
    req.query.userId ||
    req.params.userId ||
    null
  );
}

async function resolveActorId(pool, preferredId) {
  if (preferredId) {
    return preferredId;
  }
  const fallback = await pool
    .request()
    .query("SELECT TOP 1 user_id FROM dbo.USERS WHERE role = 'admin' ORDER BY created_at ASC");
  return fallback.recordset[0]?.user_id || null;
}

router.get('/health', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query('SELECT 1 AS ok');
  res.json({ ok: result.recordset[0].ok === 1 });
});

router.post('/signup', async (req, res) => {
  try {
    const { fullName, name, email, password } = req.body;
    const userName = fullName || name;
    if (!userName || !email || !password) {
      return res.status(400).json({ msg: 'name, email and password are required' });
    }

    const pool = await getPool();
    const exists = await pool
      .request()
      .input('email', sql.NVarChar(180), email.toLowerCase())
      .query('SELECT user_id FROM dbo.USERS WHERE email = @email');

    if (exists.recordset.length > 0) {
      return res.status(409).json({ msg: 'Email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool
      .request()
      .input('name', sql.NVarChar(120), userName)
      .input('email', sql.NVarChar(180), email.toLowerCase())
      .input('password_hash', sql.NVarChar(255), hash)
      .query(`
        INSERT INTO dbo.USERS (name, email, password_hash, role)
        OUTPUT INSERTED.user_id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.created_at
        VALUES (@name, @email, @password_hash, 'student')
      `);

    const user = normalizeUser(result.recordset[0]);
    await logActivity(pool, user.user_id, 'signup', 'USERS', user.user_id);

    return res.status(201).json({ msg: 'Signup successful', user });
  } catch (error) {
    return res.status(500).json({ msg: 'Signup failed', error: String(error.message || error) });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: 'email and password are required' });
    }

    const pool = await getPool();
    const userResult = await pool
      .request()
      .input('email', sql.NVarChar(180), email.toLowerCase())
      .query('SELECT user_id, name, email, password_hash, role, created_at FROM dbo.USERS WHERE email = @email');

    const userRow = userResult.recordset[0];
    if (!userRow) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, userRow.password_hash);
    if (!valid) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ user_id: userRow.user_id, role: userRow.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    const user = normalizeUser(userRow);
    await logActivity(pool, user.user_id, 'login', 'USERS', user.user_id);

    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ msg: 'Login failed', error: String(error.message || error) });
  }
});

router.get('/announcements', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT a.announcement_id AS _id, a.announcement_id, a.title, a.message, a.created_at,
           a.created_by AS adminId,
           u.name AS createdByName
    FROM dbo.ANNOUNCEMENTS a
    JOIN dbo.USERS u ON u.user_id = a.created_by
    ORDER BY a.created_at DESC
  `);
  res.json(result.recordset);
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, message, created_by, userId } = req.body;
    let authorId = created_by || userId || extractUserId(req);
    const pool = await getPool();
    authorId = await resolveActorId(pool, authorId);
    if (!title || !message || !authorId) {
      return res.status(400).json({ msg: 'title, message and created_by/userId are required' });
    }

    const result = await pool
      .request()
      .input('title', sql.NVarChar(200), title)
      .input('message', sql.NVarChar(sql.MAX), message)
      .input('created_by', sql.UniqueIdentifier, authorId)
      .query(`
        INSERT INTO dbo.ANNOUNCEMENTS (title, message, created_by)
        OUTPUT INSERTED.announcement_id AS _id, INSERTED.announcement_id, INSERTED.title, INSERTED.message, INSERTED.created_at
        VALUES (@title, @message, @created_by)
      `);

    await logActivity(pool, authorId, 'create_announcement', 'ANNOUNCEMENTS', result.recordset[0].announcement_id);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to create announcement', error: String(error.message || error) });
  }
});

router.get('/tuitions', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT t.tuition_id AS _id, t.tuition_id, t.user_id, t.subject, t.subject AS title, t.salary, t.location,
           t.status, t.created_at
    FROM dbo.TUITIONS t
    ORDER BY t.created_at DESC
  `);
  res.json(result.recordset);
});

router.post('/tuitions', async (req, res) => {
  try {
    const { userId, user_id, subject, title, salary, location, status } = req.body;
    const ownerId = userId || user_id;
    const finalSubject = subject || title;
    if (!finalSubject || salary === undefined || !location) {
      return res.status(400).json({ msg: 'subject/title, salary and location are required' });
    }

    const pool = await getPool();
    const resolvedOwnerId = await resolveActorId(pool, ownerId);
    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, resolvedOwnerId)
      .input('subject', sql.NVarChar(140), finalSubject)
      .input('salary', sql.Decimal(10, 2), Number(salary))
      .input('location', sql.NVarChar(160), location)
      .input('status', sql.NVarChar(30), status || 'open')
      .query(`
        INSERT INTO dbo.TUITIONS (user_id, subject, salary, location, status)
        OUTPUT INSERTED.tuition_id AS _id, INSERTED.tuition_id, INSERTED.user_id, INSERTED.subject,
               INSERTED.subject AS title, INSERTED.salary, INSERTED.location, INSERTED.status, INSERTED.created_at
        VALUES (@user_id, @subject, @salary, @location, @status)
      `);

    await logActivity(pool, resolvedOwnerId, 'create_tuition', 'TUITIONS', result.recordset[0].tuition_id);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to create tuition', error: String(error.message || error) });
  }
});

router.post('/applied-tuitions', async (req, res) => {
  try {
    const userId = extractUserId(req);
    const tuitionId = req.body.tuitionId || req.body.tuition_id;
    if (!userId || !tuitionId) {
      return res.status(400).json({ msg: 'userId and tuitionId are required' });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('tuition_id', sql.UniqueIdentifier, tuitionId)
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('status', sql.NVarChar(30), 'pending')
      .query(`
        INSERT INTO dbo.APPLIEDTUITIONS (tuition_id, user_id, status)
        OUTPUT INSERTED.application_id AS _id, INSERTED.application_id, INSERTED.tuition_id,
               INSERTED.user_id, INSERTED.status, INSERTED.applied_at
        VALUES (@tuition_id, @user_id, @status)
      `);

    await logActivity(pool, userId, 'apply_tuition', 'APPLIEDTUITIONS', result.recordset[0].application_id);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to apply for tuition', error: String(error.message || error) });
  }
});

router.get('/applied-tuitions', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT a.application_id AS _id, a.application_id, a.tuition_id AS tuitionId, a.user_id AS userId, a.status, a.applied_at,
           u.name, u.email
    FROM dbo.APPLIEDTUITIONS a
    JOIN dbo.USERS u ON u.user_id = a.user_id
    ORDER BY a.applied_at DESC
  `);
  res.json(result.recordset);
});

router.delete('/applied-tuitions/:id', async (req, res) => {
  const pool = await getPool();
  await pool.request().input('application_id', sql.UniqueIdentifier, req.params.id).query(`
    DELETE FROM dbo.APPLIEDTUITIONS WHERE application_id = @application_id
  `);
  res.json({ ok: true });
});

router.post('/applied-tuitions/:id/verify', async (req, res) => {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    const lookup = await tx
      .request()
      .input('application_id', sql.UniqueIdentifier, req.params.id)
      .query(`SELECT application_id, user_id FROM dbo.APPLIEDTUITIONS WHERE application_id = @application_id`);

    if (lookup.recordset.length === 0) {
      await tx.rollback();
      return res.status(404).json({ msg: 'Application not found' });
    }

    const insertBooking = await tx
      .request()
      .input('application_id', sql.UniqueIdentifier, req.params.id)
      .query(`
        INSERT INTO dbo.BOOKEDTUITIONS (application_id)
        OUTPUT INSERTED.booking_id AS _id, INSERTED.booking_id, INSERTED.application_id, INSERTED.confirmed_at
        VALUES (@application_id)
      `);

    await tx
      .request()
      .input('application_id', sql.UniqueIdentifier, req.params.id)
      .query(`UPDATE dbo.APPLIEDTUITIONS SET status = 'booked' WHERE application_id = @application_id`);

    await logActivity(tx, lookup.recordset[0].user_id, 'book_tuition', 'BOOKEDTUITIONS', insertBooking.recordset[0].booking_id);
    await tx.commit();
    res.json({ booked: insertBooking.recordset[0] });
  } catch (error) {
    if (tx._aborted !== true) {
      await tx.rollback();
    }
    res.status(500).json({ msg: 'Failed to verify tuition application', error: String(error.message || error) });
  }
});

router.get('/booked-tuitions', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT b.booking_id AS _id, b.booking_id, b.application_id, b.confirmed_at,
           t.subject AS title, t.location,
           u.name AS applicantName, u.email AS applicantEmail
    FROM dbo.BOOKEDTUITIONS b
    JOIN dbo.APPLIEDTUITIONS a ON a.application_id = b.application_id
    JOIN dbo.TUITIONS t ON t.tuition_id = a.tuition_id
    JOIN dbo.USERS u ON u.user_id = a.user_id
    ORDER BY b.confirmed_at DESC
  `);
  res.json(result.recordset);
});

router.post('/booked-tuitions/:id/unbook', async (req, res) => {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();
    const lookup = await tx
      .request()
      .input('booking_id', sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT b.booking_id, b.application_id, a.user_id
        FROM dbo.BOOKEDTUITIONS b
        JOIN dbo.APPLIEDTUITIONS a ON a.application_id = b.application_id
        WHERE b.booking_id = @booking_id
      `);

    if (lookup.recordset.length === 0) {
      await tx.rollback();
      return res.status(404).json({ msg: 'Booking not found' });
    }

    await tx.request().input('booking_id', sql.UniqueIdentifier, req.params.id).query(`DELETE FROM dbo.BOOKEDTUITIONS WHERE booking_id = @booking_id`);
    await tx
      .request()
      .input('application_id', sql.UniqueIdentifier, lookup.recordset[0].application_id)
      .query(`UPDATE dbo.APPLIEDTUITIONS SET status = 'pending' WHERE application_id = @application_id`);

    await logActivity(tx, lookup.recordset[0].user_id, 'unbook_tuition', 'BOOKEDTUITIONS', req.params.id);
    await tx.commit();
    res.json({ ok: true });
  } catch (error) {
    if (tx._aborted !== true) await tx.rollback();
    res.status(500).json({ msg: 'Failed to unbook tuition', error: String(error.message || error) });
  }
});

router.get('/maids', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT m.maid_id AS _id, m.maid_id, m.user_id, m.salary, m.salary AS hourlyRate,
           m.location, m.availability, m.availability AS name, m.created_at
    FROM dbo.MAIDS m
    ORDER BY m.created_at DESC
  `);
  res.json(result.recordset);
});

router.post('/maids', async (req, res) => {
  try {
    const ownerId = req.body.userId || req.body.user_id;
    const salary = req.body.salary ?? req.body.hourlyRate;
    const location = req.body.location || 'Unknown';
    const availability = req.body.availability || req.body.name || 'available';
    if (salary === undefined) {
      return res.status(400).json({ msg: 'salary/hourlyRate is required' });
    }

    const pool = await getPool();
    const resolvedOwnerId = await resolveActorId(pool, ownerId);
    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, resolvedOwnerId)
      .input('salary', sql.Decimal(10, 2), Number(salary))
      .input('location', sql.NVarChar(160), location)
      .input('availability', sql.NVarChar(40), availability)
      .query(`
        INSERT INTO dbo.MAIDS (user_id, salary, location, availability)
        OUTPUT INSERTED.maid_id AS _id, INSERTED.maid_id, INSERTED.user_id,
               INSERTED.salary, INSERTED.salary AS hourlyRate,
               INSERTED.location, INSERTED.availability, INSERTED.availability AS name, INSERTED.created_at
        VALUES (@user_id, @salary, @location, @availability)
      `);

    await logActivity(pool, resolvedOwnerId, 'create_maid', 'MAIDS', result.recordset[0].maid_id);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to create maid', error: String(error.message || error) });
  }
});

router.post('/applied-maids', async (req, res) => {
  try {
    const userId = extractUserId(req);
    const maidId = req.body.maidId || req.body.maid_id;
    if (!userId || !maidId) {
      return res.status(400).json({ msg: 'userId and maidId are required' });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('maid_id', sql.UniqueIdentifier, maidId)
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('status', sql.NVarChar(30), 'pending')
      .query(`
        INSERT INTO dbo.APPLIEDMAIDS (maid_id, user_id, status)
        OUTPUT INSERTED.application_id AS _id, INSERTED.application_id, INSERTED.maid_id,
               INSERTED.user_id, INSERTED.status, INSERTED.applied_at
        VALUES (@maid_id, @user_id, @status)
      `);

    await logActivity(pool, userId, 'apply_maid', 'APPLIEDMAIDS', result.recordset[0].application_id);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to apply for maid', error: String(error.message || error) });
  }
});

router.get('/applied-maids', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT a.application_id AS _id, a.application_id, a.maid_id AS maidId, a.user_id AS userId,
           a.status, a.applied_at, u.name, u.email
    FROM dbo.APPLIEDMAIDS a
    JOIN dbo.USERS u ON u.user_id = a.user_id
    ORDER BY a.applied_at DESC
  `);
  res.json(result.recordset);
});

router.delete('/applied-maids/:id', async (req, res) => {
  const pool = await getPool();
  await pool.request().input('application_id', sql.UniqueIdentifier, req.params.id).query(`
    DELETE FROM dbo.APPLIEDMAIDS WHERE application_id = @application_id
  `);
  res.json({ ok: true });
});

router.post('/applied-maids/:id/verify', async (req, res) => {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    const lookup = await tx
      .request()
      .input('application_id', sql.UniqueIdentifier, req.params.id)
      .query(`SELECT application_id, user_id FROM dbo.APPLIEDMAIDS WHERE application_id = @application_id`);

    if (lookup.recordset.length === 0) {
      await tx.rollback();
      return res.status(404).json({ msg: 'Application not found' });
    }

    const insertBooking = await tx
      .request()
      .input('application_id', sql.UniqueIdentifier, req.params.id)
      .query(`
        INSERT INTO dbo.BOOKEDMAIDS (application_id)
        OUTPUT INSERTED.booking_id AS _id, INSERTED.booking_id, INSERTED.application_id, INSERTED.confirmed_at
        VALUES (@application_id)
      `);

    await tx
      .request()
      .input('application_id', sql.UniqueIdentifier, req.params.id)
      .query(`UPDATE dbo.APPLIEDMAIDS SET status = 'booked' WHERE application_id = @application_id`);

    await logActivity(tx, lookup.recordset[0].user_id, 'book_maid', 'BOOKEDMAIDS', insertBooking.recordset[0].booking_id);
    await tx.commit();
    res.json({ booked: insertBooking.recordset[0] });
  } catch (error) {
    if (tx._aborted !== true) await tx.rollback();
    res.status(500).json({ msg: 'Failed to verify maid application', error: String(error.message || error) });
  }
});

router.get('/booked-maids', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT b.booking_id AS _id, b.booking_id, b.application_id, b.confirmed_at,
           m.location, m.availability AS name,
           u.name AS applicantName, u.email AS applicantEmail
    FROM dbo.BOOKEDMAIDS b
    JOIN dbo.APPLIEDMAIDS a ON a.application_id = b.application_id
    JOIN dbo.MAIDS m ON m.maid_id = a.maid_id
    JOIN dbo.USERS u ON u.user_id = a.user_id
    ORDER BY b.confirmed_at DESC
  `);
  res.json(result.recordset);
});

router.post('/booked-maids/:id/unbook', async (req, res) => {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    const lookup = await tx
      .request()
      .input('booking_id', sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT b.booking_id, b.application_id, a.user_id
        FROM dbo.BOOKEDMAIDS b
        JOIN dbo.APPLIEDMAIDS a ON a.application_id = b.application_id
        WHERE b.booking_id = @booking_id
      `);

    if (lookup.recordset.length === 0) {
      await tx.rollback();
      return res.status(404).json({ msg: 'Booking not found' });
    }

    await tx.request().input('booking_id', sql.UniqueIdentifier, req.params.id).query(`DELETE FROM dbo.BOOKEDMAIDS WHERE booking_id = @booking_id`);
    await tx
      .request()
      .input('application_id', sql.UniqueIdentifier, lookup.recordset[0].application_id)
      .query(`UPDATE dbo.APPLIEDMAIDS SET status = 'pending' WHERE application_id = @application_id`);

    await logActivity(tx, lookup.recordset[0].user_id, 'unbook_maid', 'BOOKEDMAIDS', req.params.id);
    await tx.commit();
    res.json({ ok: true });
  } catch (error) {
    if (tx._aborted !== true) await tx.rollback();
    res.status(500).json({ msg: 'Failed to unbook maid', error: String(error.message || error) });
  }
});

router.get('/roommates/listings', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT r.listing_id AS _id, r.listing_id, r.user_id, r.location, r.rent, r.preference, r.type, r.created_at,
           u.name, u.email
    FROM dbo.ROOMMATELISTINGS r
    JOIN dbo.USERS u ON u.user_id = r.user_id
    WHERE r.type = 'host'
    ORDER BY r.created_at DESC
  `);

  const rows = result.recordset.map((row) => {
    let pref = {};
    try { pref = row.preference ? JSON.parse(row.preference) : {}; } catch (_) {}
    return {
      ...row,
      roomsAvailable: pref.roomsAvailable || '',
      details: pref.details || '',
      contact: pref.contact || '',
      name: pref.name || row.name,
      email: pref.email || row.email,
    };
  });

  res.json(rows);
});

router.get('/roommates/:userId/listing', async (req, res) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('user_id', sql.UniqueIdentifier, req.params.userId)
    .query(`
      SELECT TOP 1 listing_id AS _id, listing_id, user_id, location, rent, preference, type, created_at
      FROM dbo.ROOMMATELISTINGS
      WHERE user_id = @user_id AND type = 'host'
      ORDER BY created_at DESC
    `);

  const row = result.recordset[0];
  if (!row) return res.status(404).json({ msg: 'Listing not found' });

  let pref = {};
  try { pref = row.preference ? JSON.parse(row.preference) : {}; } catch (_) {}
  return res.json({ ...row, ...pref });
});

router.post('/roommates/:userId/apply', async (req, res) => {
  try {
    const { location, roomsAvailable, details, name, email, contact } = req.body;
    const pool = await getPool();
    const prefJson = JSON.stringify({ roomsAvailable, details, name, email, contact });

    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, req.params.userId)
      .input('location', sql.NVarChar(160), location || 'Unknown')
      .input('rent', sql.Decimal(10, 2), Number(req.body.rent || 0))
      .input('preference', sql.NVarChar(sql.MAX), prefJson)
      .input('type', sql.NVarChar(20), 'host')
      .query(`
        INSERT INTO dbo.ROOMMATELISTINGS (user_id, location, rent, preference, type)
        OUTPUT INSERTED.listing_id AS _id, INSERTED.listing_id, INSERTED.user_id, INSERTED.location,
               INSERTED.rent, INSERTED.preference, INSERTED.type, INSERTED.created_at
        VALUES (@user_id, @location, @rent, @preference, @type)
      `);

    await logActivity(pool, req.params.userId, 'create_roommate_listing', 'ROOMMATELISTINGS', result.recordset[0].listing_id);

    const listing = { ...result.recordset[0], roomsAvailable, details, name, email, contact };
    return res.status(201).json({ listing });
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to create roommate listing', error: String(error.message || error) });
  }
});

router.put('/roommates/:userId/listing', async (req, res) => {
  const pool = await getPool();
  const prefJson = JSON.stringify({
    roomsAvailable: req.body.roomsAvailable,
    details: req.body.details,
    name: req.body.name,
    email: req.body.email,
    contact: req.body.contact,
  });

  const result = await pool
    .request()
    .input('user_id', sql.UniqueIdentifier, req.params.userId)
    .input('location', sql.NVarChar(160), req.body.location || 'Unknown')
    .input('rent', sql.Decimal(10, 2), Number(req.body.rent || 0))
    .input('preference', sql.NVarChar(sql.MAX), prefJson)
    .query(`
      UPDATE dbo.ROOMMATELISTINGS
      SET location = @location, rent = @rent, preference = @preference
      OUTPUT INSERTED.listing_id AS _id, INSERTED.listing_id, INSERTED.user_id, INSERTED.location,
             INSERTED.rent, INSERTED.preference, INSERTED.type, INSERTED.created_at
      WHERE user_id = @user_id AND type = 'host'
    `);

  if (result.recordset.length === 0) {
    return res.status(404).json({ msg: 'Listing not found' });
  }

  await logActivity(pool, req.params.userId, 'update_roommate_listing', 'ROOMMATELISTINGS', result.recordset[0].listing_id);
  res.json({ listing: { ...result.recordset[0], ...req.body } });
});

router.delete('/roommates/:userId/listing', async (req, res) => {
  const pool = await getPool();
  await pool
    .request()
    .input('user_id', sql.UniqueIdentifier, req.params.userId)
    .query(`DELETE FROM dbo.ROOMMATELISTINGS WHERE user_id = @user_id AND type = 'host'`);
  await logActivity(pool, req.params.userId, 'delete_roommate_listing', 'ROOMMATELISTINGS', null);
  res.json({ ok: true });
});

router.post('/roommates/applied', async (req, res) => {
  try {
    const userId = extractUserId(req);
    const listingId = req.body.listingId || req.body.listing_id;
    if (!userId || !listingId) {
      return res.status(400).json({ msg: 'userId and listingId are required' });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('listing_id', sql.UniqueIdentifier, listingId)
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('status', sql.NVarChar(30), 'pending')
      .query(`
        INSERT INTO dbo.APPLIEDROOMMATES (listing_id, user_id, status)
        OUTPUT INSERTED.application_id AS _id, INSERTED.application_id, INSERTED.listing_id,
               INSERTED.user_id, INSERTED.status, INSERTED.applied_at
        VALUES (@listing_id, @user_id, @status)
      `);

    await logActivity(pool, userId, 'apply_roommate', 'APPLIEDROOMMATES', result.recordset[0].application_id);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to apply for roommate listing', error: String(error.message || error) });
  }
});

router.get('/roommates/applied', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT a.application_id AS _id, a.application_id, a.listing_id, a.user_id, a.status, a.applied_at,
           u.name, u.email, r.location, r.preference
    FROM dbo.APPLIEDROOMMATES a
    JOIN dbo.USERS u ON u.user_id = a.user_id
    JOIN dbo.ROOMMATELISTINGS r ON r.listing_id = a.listing_id
    ORDER BY a.applied_at DESC
  `);

  const rows = result.recordset.map((row) => {
    let pref = {};
    try { pref = row.preference ? JSON.parse(row.preference) : {}; } catch (_) {}
    return { ...row, ...pref };
  });

  res.json(rows);
});

router.get('/roommates/applied-to-host', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT a.application_id AS _id, a.application_id, a.listing_id, a.user_id, a.status, a.applied_at,
           u.name, u.email, r.location, r.preference
    FROM dbo.APPLIEDROOMMATES a
    JOIN dbo.USERS u ON u.user_id = a.user_id
    JOIN dbo.ROOMMATELISTINGS r ON r.listing_id = a.listing_id
    ORDER BY a.applied_at DESC
  `);
  res.json(result.recordset);
});

router.delete('/roommates/applied/:id', async (req, res) => {
  const pool = await getPool();
  await pool
    .request()
    .input('application_id', sql.UniqueIdentifier, req.params.id)
    .query(`DELETE FROM dbo.APPLIEDROOMMATES WHERE application_id = @application_id`);
  res.json({ ok: true });
});

async function verifyRoommateApplication(applicationId, res) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    const lookup = await tx
      .request()
      .input('application_id', sql.UniqueIdentifier, applicationId)
      .query(`SELECT application_id, user_id FROM dbo.APPLIEDROOMMATES WHERE application_id = @application_id`);

    if (lookup.recordset.length === 0) {
      await tx.rollback();
      return res.status(404).json({ msg: 'Application not found' });
    }

    const insertBooking = await tx
      .request()
      .input('application_id', sql.UniqueIdentifier, applicationId)
      .query(`
        INSERT INTO dbo.BOOKEDROOMMATES (application_id)
        OUTPUT INSERTED.booking_id AS _id, INSERTED.booking_id, INSERTED.application_id, INSERTED.confirmed_at
        VALUES (@application_id)
      `);

    await tx
      .request()
      .input('application_id', sql.UniqueIdentifier, applicationId)
      .query(`UPDATE dbo.APPLIEDROOMMATES SET status = 'booked' WHERE application_id = @application_id`);

    await logActivity(tx, lookup.recordset[0].user_id, 'book_roommate', 'BOOKEDROOMMATES', insertBooking.recordset[0].booking_id);
    await tx.commit();
    return res.json({ booked: insertBooking.recordset[0] });
  } catch (error) {
    if (tx._aborted !== true) await tx.rollback();
    return res.status(500).json({ msg: 'Failed to verify roommate application', error: String(error.message || error) });
  }
}

router.post('/roommates/applied/:id/verify', async (req, res) => verifyRoommateApplication(req.params.id, res));
router.post('/roommates/applied-to-host/:id/verify', async (req, res) => verifyRoommateApplication(req.params.id, res));

router.get('/roommates/booked', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT b.booking_id AS _id, b.booking_id, b.application_id, b.confirmed_at,
           applicant.name AS applicantName, applicant.email AS applicantEmail,
           host.name AS hostName, host.email AS hostEmail,
           r.location, r.preference
    FROM dbo.BOOKEDROOMMATES b
    JOIN dbo.APPLIEDROOMMATES a ON a.application_id = b.application_id
    JOIN dbo.USERS applicant ON applicant.user_id = a.user_id
    JOIN dbo.ROOMMATELISTINGS r ON r.listing_id = a.listing_id
    JOIN dbo.USERS host ON host.user_id = r.user_id
    ORDER BY b.confirmed_at DESC
  `);

  const rows = result.recordset.map((row) => {
    let pref = {};
    try { pref = row.preference ? JSON.parse(row.preference) : {}; } catch (_) {}
    return { ...row, ...pref };
  });

  res.json(rows);
});

router.post('/roommates/booked/:id/unbook', async (req, res) => {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    const lookup = await tx
      .request()
      .input('booking_id', sql.UniqueIdentifier, req.params.id)
      .query(`
        SELECT b.booking_id, b.application_id, a.user_id
        FROM dbo.BOOKEDROOMMATES b
        JOIN dbo.APPLIEDROOMMATES a ON a.application_id = b.application_id
        WHERE b.booking_id = @booking_id
      `);

    if (lookup.recordset.length === 0) {
      await tx.rollback();
      return res.status(404).json({ msg: 'Booking not found' });
    }

    await tx.request().input('booking_id', sql.UniqueIdentifier, req.params.id).query(`DELETE FROM dbo.BOOKEDROOMMATES WHERE booking_id = @booking_id`);
    await tx
      .request()
      .input('application_id', sql.UniqueIdentifier, lookup.recordset[0].application_id)
      .query(`UPDATE dbo.APPLIEDROOMMATES SET status = 'pending' WHERE application_id = @application_id`);

    await logActivity(tx, lookup.recordset[0].user_id, 'unbook_roommate', 'BOOKEDROOMMATES', req.params.id);
    await tx.commit();
    res.json({ ok: true });
  } catch (error) {
    if (tx._aborted !== true) await tx.rollback();
    res.status(500).json({ msg: 'Failed to unbook roommate', error: String(error.message || error) });
  }
});

router.get('/house-rent', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT house_id AS _id, house_id, user_id, location, rent AS price, rent, rooms,
           description, created_at
    FROM dbo.HOUSERENTLISTINGS
    ORDER BY created_at DESC
  `);
  res.json(result.recordset.map((row) => ({ ...row, title: row.location })));
});

router.post('/house-rent/create', async (req, res) => {
  try {
    const userId = req.body.userId || req.body.user_id || req.body.ownerId;
    const pool = await getPool();
    const resolvedOwnerId = await resolveActorId(pool, userId);
    if (!resolvedOwnerId) {
      return res.status(400).json({ msg: 'userId is required' });
    }
    const rent = Number(req.body.rent ?? req.body.price ?? 0);
    const rooms = Number(req.body.rooms ?? 1);

    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, resolvedOwnerId)
      .input('location', sql.NVarChar(160), req.body.location || 'Unknown')
      .input('rent', sql.Decimal(10, 2), rent)
      .input('rooms', sql.Int, rooms)
      .input('description', sql.NVarChar(sql.MAX), req.body.description || req.body.title || '')
      .query(`
        INSERT INTO dbo.HOUSERENTLISTINGS (user_id, location, rent, rooms, description)
        OUTPUT INSERTED.house_id AS _id, INSERTED.house_id, INSERTED.user_id, INSERTED.location,
               INSERTED.rent AS price, INSERTED.rent, INSERTED.rooms, INSERTED.description, INSERTED.created_at
        VALUES (@user_id, @location, @rent, @rooms, @description)
      `);

    await logActivity(pool, resolvedOwnerId, 'create_house_listing', 'HOUSERENTLISTINGS', result.recordset[0].house_id);
    res.status(201).json({ listing: { ...result.recordset[0], title: result.recordset[0].location } });
  } catch (error) {
    res.status(500).json({ msg: 'Failed to create house listing', error: String(error.message || error) });
  }
});

router.get('/house-rent/admin/unverified', async (_req, res) => {
  res.json([]);
});

router.post('/house-rent/admin/:id/verify', async (_req, res) => {
  res.json({ ok: true });
});

router.delete('/house-rent/admin/:id', async (req, res) => {
  const pool = await getPool();
  await pool.request().input('house_id', sql.UniqueIdentifier, req.params.id).query(`
    DELETE FROM dbo.HOUSERENTLISTINGS WHERE house_id = @house_id
  `);
  res.json({ ok: true });
});

router.post('/house-rent/contact', async (req, res) => {
  try {
    const houseId = req.body.houseId || req.body.house_id || req.body.listingId || req.body.receiverId;
    const userId = extractUserId(req) || req.body.senderId;
    const message = req.body.message;
    if (!houseId || !userId || !message) {
      return res.status(400).json({ msg: 'houseId, userId and message are required' });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('house_id', sql.UniqueIdentifier, houseId)
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('message', sql.NVarChar(sql.MAX), message)
      .query(`
        INSERT INTO dbo.HOUSECONTACTS (house_id, user_id, message)
        OUTPUT INSERTED.contact_id AS _id, INSERTED.contact_id, INSERTED.house_id, INSERTED.user_id, INSERTED.message, INSERTED.created_at
        VALUES (@house_id, @user_id, @message)
      `);

    await logActivity(pool, userId, 'contact_house', 'HOUSECONTACTS', result.recordset[0].contact_id);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to create house contact', error: String(error.message || error) });
  }
});

router.get('/house-rent/contacts/:userId', async (req, res) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('user_id', sql.UniqueIdentifier, req.params.userId)
    .query(`
      SELECT c.contact_id AS _id, c.contact_id, c.house_id, c.user_id, c.message, c.created_at,
             h.location, h.rent, h.rooms
      FROM dbo.HOUSECONTACTS c
      JOIN dbo.HOUSERENTLISTINGS h ON h.house_id = c.house_id
      WHERE c.user_id = @user_id
      ORDER BY c.created_at DESC
    `);
  res.json(result.recordset);
});

router.get('/marketplace', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT m.item_id AS _id, m.item_id, m.user_id, m.title, m.price, m.[condition], m.status, m.created_at,
           u.email AS sellerEmail
    FROM dbo.MARKETPLACELISTINGS m
    JOIN dbo.USERS u ON u.user_id = m.user_id
    ORDER BY m.created_at DESC
  `);
  res.json(result.recordset);
});

router.post('/marketplace', async (req, res) => {
  try {
    const userId = req.body.userId || req.body.user_id;
    if (!req.body.title || req.body.price === undefined) {
      return res.status(400).json({ msg: 'title and price are required' });
    }

    const pool = await getPool();
    const resolvedOwnerId = await resolveActorId(pool, userId);
    if (!resolvedOwnerId) {
      return res.status(400).json({ msg: 'userId is required' });
    }
    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, resolvedOwnerId)
      .input('title', sql.NVarChar(160), req.body.title)
      .input('price', sql.Decimal(10, 2), Number(req.body.price))
      .input('condition', sql.NVarChar(40), req.body.condition || 'used')
      .input('status', sql.NVarChar(30), req.body.status || 'available')
      .query(`
        INSERT INTO dbo.MARKETPLACELISTINGS (user_id, title, price, [condition], status)
        OUTPUT INSERTED.item_id AS _id, INSERTED.item_id, INSERTED.user_id, INSERTED.title,
               INSERTED.price, INSERTED.[condition], INSERTED.status, INSERTED.created_at
        VALUES (@user_id, @title, @price, @condition, @status)
      `);

    await logActivity(pool, resolvedOwnerId, 'create_marketplace_item', 'MARKETPLACELISTINGS', result.recordset[0].item_id);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to create marketplace listing', error: String(error.message || error) });
  }
});

router.post('/marketplace/:id/buy', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('item_id', sql.UniqueIdentifier, req.params.id)
      .query(`
        UPDATE dbo.MARKETPLACELISTINGS
        SET status = 'sold'
        OUTPUT INSERTED.item_id AS _id, INSERTED.item_id, INSERTED.user_id, INSERTED.title,
               INSERTED.price, INSERTED.[condition], INSERTED.status, INSERTED.created_at
        WHERE item_id = @item_id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ msg: 'Item not found' });
    }

    await logActivity(pool, result.recordset[0].user_id, 'sell_marketplace_item', 'MARKETPLACELISTINGS', result.recordset[0].item_id);
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to buy item', error: String(error.message || error) });
  }
});

router.post('/subscription', async (req, res) => {
  try {
    const userId = req.body.userId || req.body.user_id;
    const amount = req.body.amount ?? 99;
    const status = req.body.status || 'paid';
    const pool = await getPool();
    const resolvedUserId = await resolveActorId(pool, userId);
    if (!resolvedUserId) {
      return res.status(400).json({ msg: 'userId is required' });
    }
    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, resolvedUserId)
      .input('amount', sql.Decimal(10, 2), Number(amount))
      .input('status', sql.NVarChar(30), status)
      .query(`
        INSERT INTO dbo.SUBSCRIPTIONPAYMENTS (user_id, amount, status)
        OUTPUT INSERTED.payment_id AS _id, INSERTED.payment_id, INSERTED.user_id, INSERTED.amount,
               INSERTED.status, INSERTED.payment_date
        VALUES (@user_id, @amount, @status)
      `);

    await logActivity(pool, resolvedUserId, 'create_subscription_payment', 'SUBSCRIPTIONPAYMENTS', result.recordset[0].payment_id);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to create payment', error: String(error.message || error) });
  }
});

router.get('/subscription/payments/:userId', async (req, res) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('user_id', sql.UniqueIdentifier, req.params.userId)
    .query(`
      SELECT payment_id AS _id, payment_id, user_id, amount, status, payment_date
      FROM dbo.SUBSCRIPTIONPAYMENTS
      WHERE user_id = @user_id
      ORDER BY payment_date DESC
    `);
  res.json(result.recordset);
});

router.get('/activity', async (req, res) => {
  const userId = req.query.userId;
  const pool = await getPool();
  const request = pool.request();
  let query = `
    SELECT activity_id AS _id, activity_id, user_id, action_type, reference_table, reference_id, [timestamp]
    FROM dbo.USERACTIVITIES
  `;
  if (userId) {
    request.input('user_id', sql.UniqueIdentifier, userId);
    query += ' WHERE user_id = @user_id';
  }
  query += ' ORDER BY [timestamp] DESC';
  const result = await request.query(query);
  res.json(result.recordset);
});

router.get('/users', async (_req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT user_id AS _id, user_id, name, email, role, created_at
    FROM dbo.USERS
    ORDER BY created_at DESC
  `);
  res.json(result.recordset);
});

export default router;
