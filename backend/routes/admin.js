import express from 'express';
import { adminLogin } from '../controllers/adminController.js';
import { createRequest, getPool, sql } from '../db/connection.js';
import { getAuthUserId, requireAuth, requireRole } from '../utils/auth.js';

const router = express.Router();

router.post('/login', adminLogin);

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', async (_req, res) => {
	try {
		const pool = await getPool();
		try {
			const stats = await pool.request().query(`
				SELECT * FROM dbo.vw_admin_dashboard_summary;

				SELECT
					FORMAT(payment_date, 'yyyy-MM') AS revenue_month,
					SUM(amount) AS monthly_revenue,
					COUNT(*) AS payment_count
				FROM dbo.SUBSCRIPTIONPAYMENTS
				WHERE status = 'paid'
				GROUP BY FORMAT(payment_date, 'yyyy-MM')
				HAVING SUM(amount) > 0
				ORDER BY revenue_month DESC;

				SELECT TOP 10
					u.name,
					u.role,
					COUNT(*) AS activity_count
				FROM dbo.USERACTIVITIES ua
				INNER JOIN dbo.USERS u ON u.user_id = ua.user_id
				WHERE ua.[timestamp] >= DATEADD(DAY, -30, GETUTCDATE())
				GROUP BY u.name, u.role
				HAVING COUNT(*) >= 1
				ORDER BY activity_count DESC;
			`);
			return res.json({
				overview: stats.recordsets?.[0]?.[0] || {},
				revenueBreakdown: stats.recordsets?.[1] || [],
				activityLeaders: stats.recordsets?.[2] || [],
			});
		} catch {
			const result = await pool.request().query(`
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

				SELECT
					FORMAT(payment_date, 'yyyy-MM') AS revenue_month,
					SUM(amount) AS monthly_revenue,
					COUNT(*) AS payment_count
				FROM dbo.SUBSCRIPTIONPAYMENTS
				WHERE status = 'paid'
				GROUP BY FORMAT(payment_date, 'yyyy-MM')
				HAVING SUM(amount) > 0
				ORDER BY revenue_month DESC;

				SELECT TOP 10
					u.name,
					u.role,
					COUNT(*) AS activity_count
				FROM dbo.USERACTIVITIES ua
				INNER JOIN dbo.USERS u ON u.user_id = ua.user_id
				WHERE ua.[timestamp] >= DATEADD(DAY, -30, GETUTCDATE())
				GROUP BY u.name, u.role
				HAVING COUNT(*) >= 1
				ORDER BY activity_count DESC;
			`);
			return res.json({
				overview: result.recordsets?.[0]?.[0] || {},
				revenueBreakdown: result.recordsets?.[1] || [],
				activityLeaders: result.recordsets?.[2] || [],
			});
		}
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to load admin dashboard', error: String(error.message || error) });
	}
});

router.get('/users', async (req, res) => {
	try {
		const q = String(req.query.q || '').trim();
		const pool = await getPool();
		const result = await pool
			.request()
			.input('q', sql.NVarChar(140), `%${q}%`)
			.query(`
				SELECT
					u.user_id,
					u.name,
					u.email,
					u.role,
					ISNULL(u.is_blocked, 0) AS is_blocked,
					u.subscription_active,
					u.created_at,
					(
						SELECT COUNT(*)
						FROM dbo.USERACTIVITIES ua
						WHERE ua.user_id = u.user_id
					) AS activity_count
				FROM dbo.USERS u
				WHERE (@q = '%%' OR u.name LIKE @q OR u.email LIKE @q)
				ORDER BY u.created_at DESC;
			`);

		return res.json(result.recordset);
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to fetch users', error: String(error.message || error) });
	}
});

router.patch('/users/:id/status', async (req, res) => {
	try {
		const { id } = req.params;
		const { isBlocked, blockReason = null } = req.body;
		const pool = await getPool();
		const result = await pool
			.request()
			.input('user_id', sql.UniqueIdentifier, id)
			.input('is_blocked', sql.Bit, Boolean(isBlocked))
			.input('block_reason', sql.NVarChar(300), blockReason)
			.query(`
				UPDATE dbo.USERS
				SET is_blocked = @is_blocked,
						block_reason = CASE WHEN @is_blocked = 1 THEN @block_reason ELSE NULL END
				OUTPUT INSERTED.user_id, INSERTED.name, INSERTED.email, INSERTED.is_blocked, INSERTED.block_reason
				WHERE user_id = @user_id;
			`);

		if (!result.recordset[0]) {
			return res.status(404).json({ msg: 'User not found.' });
		}

		return res.json(result.recordset[0]);
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to update user status', error: String(error.message || error) });
	}
});

router.delete('/users/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const actorId = getAuthUserId(req);
		if (actorId && id === actorId) {
			return res.status(400).json({ msg: 'Admin cannot delete own account.' });
		}

		const pool = await getPool();
		const tx = new sql.Transaction(pool);
		await tx.begin();

		try {
			await createRequest(tx)
				.input('user_id', sql.UniqueIdentifier, id)
				.query('DELETE FROM dbo.USERACTIVITIES WHERE user_id = @user_id;');

			await createRequest(tx)
				.input('user_id', sql.UniqueIdentifier, id)
				.query('DELETE FROM dbo.SUBSCRIPTIONPAYMENTS WHERE user_id = @user_id;');

			const deleted = await createRequest(tx)
				.input('user_id', sql.UniqueIdentifier, id)
				.query('DELETE FROM dbo.USERS OUTPUT DELETED.user_id WHERE user_id = @user_id;');

			if (!deleted.recordset[0]) {
				await tx.rollback();
				return res.status(404).json({ msg: 'User not found.' });
			}

			await tx.commit();
			return res.json({ msg: 'User deleted successfully.' });
		} catch (error) {
			if (tx._aborted !== true) await tx.rollback();
			throw error;
		}
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to delete user', error: String(error.message || error) });
	}
});

router.get('/listings/pending', async (_req, res) => {
	try {
		const pool = await getPool();
		const result = await pool.request().query(`
			SELECT 'tuition' AS listing_type, t.tuition_id AS listing_id, t.subject AS title, t.location, t.status, t.created_at, u.name AS owner_name
			FROM dbo.TUITIONS t
			INNER JOIN dbo.USERS u ON u.user_id = t.user_id
			WHERE t.status IN ('pending', 'Pending')

			UNION ALL

			SELECT 'maid' AS listing_type, m.maid_id AS listing_id, CONCAT('Maid - ', m.location) AS title, m.location, ISNULL(m.status, 'Pending') AS status, m.created_at, u.name AS owner_name
			FROM dbo.MAIDS m
			INNER JOIN dbo.USERS u ON u.user_id = m.user_id
			WHERE ISNULL(m.status, 'Pending') IN ('pending', 'Pending')

			UNION ALL

			SELECT 'roommate' AS listing_type, r.listing_id AS listing_id, CONCAT('Roommate - ', r.location) AS title, r.location, ISNULL(r.status, 'Pending') AS status, r.created_at, u.name AS owner_name
			FROM dbo.ROOMMATELISTINGS r
			INNER JOIN dbo.USERS u ON u.user_id = r.user_id
			WHERE ISNULL(r.status, 'Pending') IN ('pending', 'Pending')

			UNION ALL

			SELECT 'houserent' AS listing_type, h.house_id AS listing_id, CONCAT('House Rent - ', h.location) AS title, h.location, ISNULL(h.status, 'Pending') AS status, h.created_at, u.name AS owner_name
			FROM dbo.HOUSERENTLISTINGS h
			INNER JOIN dbo.USERS u ON u.user_id = h.user_id
			WHERE ISNULL(h.status, 'Pending') IN ('pending', 'Pending')

			UNION ALL

			SELECT 'marketplace' AS listing_type, mp.item_id AS listing_id, mp.title, NULL AS location, ISNULL(mp.status, 'Pending') AS status, mp.created_at, u.name AS owner_name
			FROM dbo.MARKETPLACELISTINGS mp
			INNER JOIN dbo.USERS u ON u.user_id = mp.user_id
			WHERE ISNULL(mp.status, 'Pending') IN ('pending', 'Pending')

			ORDER BY created_at DESC;
		`);

		return res.json(result.recordset);
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to load pending listings', error: String(error.message || error) });
	}
});

router.post('/listings/review', async (req, res) => {
	try {
		const { listingType, listingId, decision } = req.body;
		if (!listingType || !listingId || !decision) {
			return res.status(400).json({ msg: 'listingType, listingId, and decision are required.' });
		}

		const actorId = getAuthUserId(req);
		const pool = await getPool();

		try {
			const reviewRes = await pool
				.request()
				.input('listing_type', sql.NVarChar(40), String(listingType).toLowerCase())
				.input('listing_id', sql.UniqueIdentifier, listingId)
				.input('decision', sql.NVarChar(40), String(decision).toLowerCase())
				.input('admin_user_id', sql.UniqueIdentifier, actorId)
				.execute('dbo.sp_admin_review_listing');

			return res.json({ msg: 'Listing review completed.', result: reviewRes.recordset || [] });
		} catch {
			const tableMap = {
				tuition: { table: 'dbo.TUITIONS', id: 'tuition_id' },
				maid: { table: 'dbo.MAIDS', id: 'maid_id' },
				roommate: { table: 'dbo.ROOMMATELISTINGS', id: 'listing_id' },
				houserent: { table: 'dbo.HOUSERENTLISTINGS', id: 'house_id' },
				marketplace: { table: 'dbo.MARKETPLACELISTINGS', id: 'item_id' },
			};
			const target = tableMap[String(listingType).toLowerCase()];
			if (!target) {
				return res.status(400).json({ msg: 'Unsupported listingType.' });
			}

			const normalized = String(decision).toLowerCase() === 'approved' ? 'Approved' : 'Rejected';
			const result = await pool
				.request()
				.input('id', sql.UniqueIdentifier, listingId)
				.query(`
					UPDATE ${target.table}
					SET status = '${normalized}'
					OUTPUT INSERTED.*
					WHERE ${target.id} = @id;
				`);

			if (!result.recordset[0]) {
				return res.status(404).json({ msg: 'Listing not found.' });
			}
			return res.json({ msg: 'Listing review completed.', listing: result.recordset[0] });
		}
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to review listing', error: String(error.message || error) });
	}
});

router.get('/applications-bookings', async (_req, res) => {
	try {
		const pool = await getPool();
		const result = await pool.request().query(`
			SELECT TOP 200
				'tuition' AS module,
				a.application_id,
				a.status AS application_status,
				a.applied_at,
				u.name AS student_name,
				t.subject AS listing_title,
				CASE WHEN EXISTS (
					SELECT 1 FROM dbo.BOOKEDTUITIONS bt WHERE bt.application_id = a.application_id
				) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS is_booked
			FROM dbo.APPLIEDTUITIONS a
			INNER JOIN dbo.USERS u ON u.user_id = a.user_id
			INNER JOIN dbo.TUITIONS t ON t.tuition_id = a.tuition_id

			UNION ALL

			SELECT TOP 200
				'maid' AS module,
				a.application_id,
				a.status AS application_status,
				a.applied_at,
				u.name AS student_name,
				CONCAT('Maid - ', m.location) AS listing_title,
				CASE WHEN EXISTS (
					SELECT 1 FROM dbo.BOOKEDMAIDS bm WHERE bm.application_id = a.application_id
				) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS is_booked
			FROM dbo.APPLIEDMAIDS a
			INNER JOIN dbo.USERS u ON u.user_id = a.user_id
			INNER JOIN dbo.MAIDS m ON m.maid_id = a.maid_id

			UNION ALL

			SELECT TOP 200
				'roommate' AS module,
				a.application_id,
				a.status AS application_status,
				a.applied_at,
				u.name AS student_name,
				CONCAT('Roommate - ', r.location) AS listing_title,
				CASE WHEN EXISTS (
					SELECT 1 FROM dbo.BOOKEDROOMMATES br WHERE br.application_id = a.application_id
				) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS is_booked
			FROM dbo.APPLIEDROOMMATES a
			INNER JOIN dbo.USERS u ON u.user_id = a.user_id
			INNER JOIN dbo.ROOMMATELISTINGS r ON r.listing_id = a.listing_id;
		`);

		return res.json(result.recordset);
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to load applications/bookings', error: String(error.message || error) });
	}
});

router.get('/payments', async (_req, res) => {
	try {
		const pool = await getPool();
		const result = await pool.request().query(`
			SELECT
				sp.payment_id,
				sp.user_id,
				u.name,
				u.email,
				sp.amount,
				sp.status,
				sp.payment_date
			FROM dbo.SUBSCRIPTIONPAYMENTS sp
			LEFT JOIN dbo.USERS u ON u.user_id = sp.user_id
			ORDER BY sp.payment_date DESC;
		`);
		return res.json(result.recordset);
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to load payments', error: String(error.message || error) });
	}
});

router.patch('/subscriptions/:userId/active', async (req, res) => {
	try {
		const { userId } = req.params;
		const { active } = req.body;
		const pool = await getPool();
		const result = await pool
			.request()
			.input('user_id', sql.UniqueIdentifier, userId)
			.input('active', sql.Bit, Boolean(active))
			.query(`
				UPDATE dbo.USERS
				SET subscription_active = @active
				OUTPUT INSERTED.user_id, INSERTED.name, INSERTED.subscription_active
				WHERE user_id = @user_id;
			`);
		if (!result.recordset[0]) {
			return res.status(404).json({ msg: 'User not found.' });
		}
		return res.json(result.recordset[0]);
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to update subscription status', error: String(error.message || error) });
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
		return res.json(result.recordset);
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to fetch announcements', error: String(error.message || error) });
	}
});

router.post('/announcements', async (req, res) => {
	try {
		const { title, message } = req.body;
		const actorId = getAuthUserId(req);
		if (!title || !message) {
			return res.status(400).json({ msg: 'title and message are required.' });
		}

		const pool = await getPool();
		const result = await pool
			.request()
			.input('title', sql.NVarChar(220), title)
			.input('message', sql.NVarChar(sql.MAX), message)
			.input('created_by', sql.UniqueIdentifier, actorId)
			.query(`
				INSERT INTO dbo.ANNOUNCEMENTS (title, message, created_by)
				OUTPUT INSERTED.*
				VALUES (@title, @message, @created_by);
			`);
		return res.status(201).json(result.recordset[0]);
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to create announcement', error: String(error.message || error) });
	}
});

router.put('/announcements/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { title, message } = req.body;
		const pool = await getPool();
		const result = await pool
			.request()
			.input('id', sql.UniqueIdentifier, id)
			.input('title', sql.NVarChar(220), title)
			.input('message', sql.NVarChar(sql.MAX), message)
			.query(`
				UPDATE dbo.ANNOUNCEMENTS
				SET title = @title, message = @message
				OUTPUT INSERTED.*
				WHERE announcement_id = @id;
			`);

		if (!result.recordset[0]) {
			return res.status(404).json({ msg: 'Announcement not found.' });
		}

		return res.json(result.recordset[0]);
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to update announcement', error: String(error.message || error) });
	}
});

router.delete('/announcements/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const pool = await getPool();
		const result = await pool
			.request()
			.input('id', sql.UniqueIdentifier, id)
			.query('DELETE FROM dbo.ANNOUNCEMENTS OUTPUT DELETED.announcement_id WHERE announcement_id = @id;');

		if (!result.recordset[0]) {
			return res.status(404).json({ msg: 'Announcement not found.' });
		}
		return res.json({ msg: 'Announcement deleted.' });
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to delete announcement', error: String(error.message || error) });
	}
});

router.get('/activities', async (_req, res) => {
	try {
		const pool = await getPool();
		const result = await pool.request().query(`
			SELECT TOP 500
				ua.activity_id,
				ua.user_id,
				u.name,
				ua.action_type,
				ua.reference_table,
				ua.reference_id,
				ua.[timestamp]
			FROM dbo.USERACTIVITIES ua
			LEFT JOIN dbo.USERS u ON u.user_id = ua.user_id
			ORDER BY ua.[timestamp] DESC;
		`);
		return res.json(result.recordset);
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to fetch activity logs', error: String(error.message || error) });
	}
});

export default router;
