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
					+ (SELECT COUNT(*) FROM dbo.BOOKEDROOMMATES)
					+ (SELECT COUNT(*) FROM dbo.BOOKEDHOUSERENTS) AS total_bookings,
					(SELECT ISNULL(SUM(amount), 0) FROM dbo.SUBSCRIPTIONPAYMENTS WHERE status = 'paid') AS total_revenue,
					(SELECT COUNT(*) FROM dbo.APPLIEDTUITIONS WHERE status = 'pending')
					+ (SELECT COUNT(*) FROM dbo.APPLIEDMAIDS WHERE status = 'pending')
					+ (SELECT COUNT(*) FROM dbo.APPLIEDROOMMATES WHERE status = 'pending')
					+ (SELECT COUNT(*) FROM dbo.APPLIEDHOUSERENTS WHERE LOWER(ISNULL(status, 'pending')) = 'pending') AS pending_applications;

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

router.get('/applications', async (_req, res) => {
	try {
		const pool = await getPool();
		const result = await pool.request().query(`
			SELECT TOP 500
				'tuition' AS module,
				a.application_id,
				a.status,
				a.applied_at,
				a.tuition_id AS listing_id,
				CONCAT(t.subject, ' - ', t.location) AS listing_title,
				u.user_id AS applicant_user_id,
				u.name AS applicant_name,
				u.email AS applicant_email,
				u.phone AS applicant_contact
			FROM dbo.APPLIEDTUITIONS a
			INNER JOIN dbo.TUITIONS t ON t.tuition_id = a.tuition_id
			INNER JOIN dbo.USERS u ON u.user_id = a.user_id
			WHERE LOWER(ISNULL(a.status, 'pending')) = 'pending'

			UNION ALL

			SELECT TOP 500
				'maid' AS module,
				a.application_id,
				a.status,
				a.applied_at,
				a.maid_id AS listing_id,
				CONCAT('Maid - ', m.location) AS listing_title,
				u.user_id AS applicant_user_id,
				u.name AS applicant_name,
				u.email AS applicant_email,
				u.phone AS applicant_contact
			FROM dbo.APPLIEDMAIDS a
			INNER JOIN dbo.MAIDS m ON m.maid_id = a.maid_id
			INNER JOIN dbo.USERS u ON u.user_id = a.user_id
			WHERE LOWER(ISNULL(a.status, 'pending')) = 'pending'

			UNION ALL

			SELECT TOP 500
				'roommate' AS module,
				a.application_id,
				a.status,
				a.applied_at,
				a.listing_id AS listing_id,
				CONCAT('Roommate - ', r.location) AS listing_title,
				u.user_id AS applicant_user_id,
				u.name AS applicant_name,
				u.email AS applicant_email,
				u.phone AS applicant_contact
			FROM dbo.APPLIEDROOMMATES a
			INNER JOIN dbo.ROOMMATELISTINGS r ON r.listing_id = a.listing_id
			INNER JOIN dbo.USERS u ON u.user_id = a.user_id
			WHERE LOWER(ISNULL(a.status, 'pending')) = 'pending'

			UNION ALL

			SELECT TOP 500
				'houserent' AS module,
				hc.application_id,
				ISNULL(hc.status, 'pending') AS status,
				hc.applied_at,
				hc.house_id AS listing_id,
				CONCAT('House Rent - ', h.location) AS listing_title,
				u.user_id AS applicant_user_id,
				u.name AS applicant_name,
				u.email AS applicant_email,
				u.phone AS applicant_contact
			FROM dbo.APPLIEDHOUSERENTS hc
			INNER JOIN dbo.HOUSERENTLISTINGS h ON h.house_id = hc.house_id
			INNER JOIN dbo.USERS u ON u.user_id = hc.user_id
			WHERE LOWER(ISNULL(hc.status, 'pending')) = 'pending'

			ORDER BY applied_at DESC;
		`);

		return res.json(result.recordset);
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to load applications', error: String(error.message || error) });
	}
});

router.post('/applications/:module/:applicationId/review', async (req, res) => {
	try {
		const { module, applicationId } = req.params;
		const decision = String(req.body.decision || '').toLowerCase();
		if (!['approved', 'rejected'].includes(decision)) {
			return res.status(400).json({ msg: 'decision must be approved or rejected.' });
		}

		const target = {
			tuition: {
				applicationTable: 'dbo.APPLIEDTUITIONS',
				applicationIdCol: 'application_id',
				listingIdCol: 'tuition_id',
				listingTable: 'dbo.TUITIONS',
				listingTableIdCol: 'tuition_id',
				listingStatusApproved: 'approved',
				listingStatusRejected: 'approved',
				bookingTable: 'dbo.BOOKEDTUITIONS',
			},
			maid: {
				applicationTable: 'dbo.APPLIEDMAIDS',
				applicationIdCol: 'application_id',
				listingIdCol: 'maid_id',
				listingTable: 'dbo.MAIDS',
				listingTableIdCol: 'maid_id',
				listingStatusApproved: 'approved',
				listingStatusRejected: 'approved',
				bookingTable: 'dbo.BOOKEDMAIDS',
			},
			roommate: {
				applicationTable: 'dbo.APPLIEDROOMMATES',
				applicationIdCol: 'application_id',
				listingIdCol: 'listing_id',
				listingTable: 'dbo.ROOMMATELISTINGS',
				listingTableIdCol: 'listing_id',
				listingStatusApproved: 'approved',
				listingStatusRejected: 'approved',
				bookingTable: 'dbo.BOOKEDROOMMATES',
			},
			houserent: {
				applicationTable: 'dbo.APPLIEDHOUSERENTS',
				applicationIdCol: 'application_id',
				listingIdCol: 'house_id',
				listingTable: 'dbo.HOUSERENTLISTINGS',
				listingTableIdCol: 'house_id',
				listingStatusApproved: 'approved',
				listingStatusRejected: 'approved',
				bookingTable: 'dbo.BOOKEDHOUSERENTS',
			},
		}[String(module).toLowerCase()];

		if (!target) {
			return res.status(400).json({ msg: 'Unsupported module.' });
		}

		const pool = await getPool();
		const actorId = getAuthUserId(req);
		const tx = new sql.Transaction(pool);
		await tx.begin();

		try {
			const currentRow = await createRequest(tx)
				.input('application_id', sql.UniqueIdentifier, applicationId)
				.query(`
					SELECT TOP 1
						${target.applicationIdCol} AS application_id,
						${target.listingIdCol} AS listing_id,
						user_id,
						status
					FROM ${target.applicationTable} WITH (UPDLOCK, HOLDLOCK)
					WHERE ${target.applicationIdCol} = @application_id;
				`);

			const current = currentRow.recordset[0];

			if (!current) {
				await tx.rollback();
				return res.status(404).json({ msg: 'Application not found.' });
			}

			const accepting = decision === 'approved';
			const finalStatus = accepting ? 'approved' : 'rejected';

			const updated = await createRequest(tx)
				.input('application_id', sql.UniqueIdentifier, applicationId)
				.input('status', sql.NVarChar(30), finalStatus)
				.query(`
					UPDATE ${target.applicationTable}
					SET status = @status
					WHERE ${target.applicationIdCol} = @application_id;

					SELECT TOP 1
						${target.applicationIdCol} AS application_id,
						user_id,
						status
					FROM ${target.applicationTable}
					WHERE ${target.applicationIdCol} = @application_id;
				`);

			const updatedApplication = updated.recordset[0] || null;
			if (!updatedApplication) {
				await tx.rollback();
				return res.status(404).json({ msg: 'Application not found.' });
			}

			if (accepting) {
				await createRequest(tx)
					.input('listing_id', sql.UniqueIdentifier, current.listing_id)
					.query(`
						UPDATE ${target.listingTable}
						SET status = '${target.listingStatusApproved}',
							is_locked = 1
						WHERE ${target.listingTableIdCol} = @listing_id;
					`);

				await createRequest(tx)
					.input('listing_id', sql.UniqueIdentifier, current.listing_id)
					.input('application_id', sql.UniqueIdentifier, applicationId)
					.query(`
						UPDATE ${target.applicationTable}
						SET status = 'rejected'
						WHERE ${target.listingIdCol} = @listing_id
							AND ${target.applicationIdCol} <> @application_id
							AND LOWER(ISNULL(status, 'pending')) = 'pending';
					`);

				await createRequest(tx)
					.input('application_id', sql.UniqueIdentifier, applicationId)
					.query(`
						IF NOT EXISTS (
							SELECT 1 FROM ${target.bookingTable} WHERE application_id = @application_id
						)
						BEGIN
							INSERT INTO ${target.bookingTable} (application_id, booking_status)
							VALUES (@application_id, 'confirmed');
						END
					`);

				if (current.user_id) {
					await createRequest(tx)
						.input('user_id', sql.UniqueIdentifier, current.user_id)
						.input('action_type', sql.NVarChar(80), `booking_confirmed_${module}`)
						.input('reference_table', sql.NVarChar(80), target.bookingTable.replace('dbo.', ''))
						.input('reference_id', sql.UniqueIdentifier, applicationId)
						.query(`
							INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
							VALUES (@user_id, @action_type, @reference_table, @reference_id);
						`);
				}
				} else {
					await createRequest(tx)
						.input('listing_id', sql.UniqueIdentifier, current.listing_id)
						.query(`
							UPDATE ${target.listingTable}
							SET status = '${target.listingStatusRejected}',
								is_locked = 0
							WHERE ${target.listingTableIdCol} = @listing_id;
						`);

					if (current.user_id) {
						await createRequest(tx)
							.input('user_id', sql.UniqueIdentifier, current.user_id)
							.input('action_type', sql.NVarChar(80), `application_rejected_${module}`)
							.input('reference_table', sql.NVarChar(80), target.applicationTable.replace('dbo.', ''))
							.input('reference_id', sql.UniqueIdentifier, applicationId)
							.query(`
								INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
								VALUES (@user_id, @action_type, @reference_table, @reference_id);
							`);
				}
			}

			if (actorId) {
				await createRequest(tx)
					.input('user_id', sql.UniqueIdentifier, actorId)
					.input('action_type', sql.NVarChar(80), `admin_review_${module}_${finalStatus}`)
					.input('reference_table', sql.NVarChar(80), target.applicationTable.replace('dbo.', ''))
					.input('reference_id', sql.UniqueIdentifier, applicationId)
					.query(`
						INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
						VALUES (@user_id, @action_type, @reference_table, @reference_id);
					`);
			}

			await tx.commit();
			return res.json({ msg: 'Application reviewed successfully.', application: updatedApplication });
		} catch (err) {
			if (tx._aborted !== true) await tx.rollback();
			throw err;
		}
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to review application', error: String(error.message || error) });
	}
});

router.get('/listings/pending', async (_req, res) => {
	try {
		const pool = await getPool();
		const result = await pool.request().query(`
			SELECT
				'tuition' AS listing_type,
				t.tuition_id AS listing_id,
				CONCAT(t.subject, ' - ', t.location) AS title,
				u.name AS owner_name,
				t.status,
				t.is_locked
			FROM dbo.TUITIONS t
			INNER JOIN dbo.USERS u ON u.user_id = t.user_id
			WHERE ISNULL(t.is_listed, 0) = 0
			  AND LOWER(ISNULL(t.status, 'pending')) = 'pending'

			UNION ALL

			SELECT
				'maid' AS listing_type,
				m.maid_id AS listing_id,
				CONCAT('Maid - ', m.location) AS title,
				u.name AS owner_name,
				m.status,
				m.is_locked
			FROM dbo.MAIDS m
			INNER JOIN dbo.USERS u ON u.user_id = m.user_id
			WHERE ISNULL(m.is_listed, 0) = 0
			  AND LOWER(ISNULL(m.status, 'pending')) = 'pending'

			UNION ALL

			SELECT
				'roommate' AS listing_type,
				r.listing_id,
				CONCAT('Roommate - ', r.location) AS title,
				u.name AS owner_name,
				r.status,
				r.is_locked
			FROM dbo.ROOMMATELISTINGS r
			INNER JOIN dbo.USERS u ON u.user_id = r.user_id
			WHERE ISNULL(r.is_listed, 0) = 0
			  AND LOWER(ISNULL(r.status, 'pending')) = 'pending'

			UNION ALL

			SELECT
				'houserent' AS listing_type,
				h.house_id AS listing_id,
				CONCAT('House Rent - ', h.location) AS title,
				u.name AS owner_name,
				h.status,
				h.is_locked
			FROM dbo.HOUSERENTLISTINGS h
			INNER JOIN dbo.USERS u ON u.user_id = h.user_id
			WHERE ISNULL(h.is_listed, 0) = 0
			  AND LOWER(ISNULL(h.status, 'pending')) = 'pending'

			ORDER BY listing_type, listing_id;
		`);

		return res.json(result.recordset);
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to load pending listings', error: String(error.message || error) });
	}
});

router.post('/listings/review', async (req, res) => {
	try {
		const { listingType, listingId, decision } = req.body;
		if (!['approved', 'rejected'].includes(decision)) {
			return res.status(400).json({ msg: 'decision must be approved or rejected.' });
		}
		if (!['tuition', 'maid', 'roommate', 'houserent'].includes(listingType)) {
			return res.status(400).json({ msg: 'Invalid listing type.' });
		}

		const tableMap = {
			tuition: 'dbo.TUITIONS',
			maid: 'dbo.MAIDS',
			roommate: 'dbo.ROOMMATELISTINGS',
			houserent: 'dbo.HOUSERENTLISTINGS',
		};
		const idColumnMap = {
			tuition: 'tuition_id',
			maid: 'maid_id',
			roommate: 'listing_id',
			houserent: 'house_id',
		};

		const table = tableMap[listingType];
		const idColumn = idColumnMap[listingType];

		const pool = await getPool();
		const actorId = getAuthUserId(req);
		const tx = new sql.Transaction(pool);
		await tx.begin();

		try {
			const updated = await createRequest(tx)
				.input('listing_id', sql.UniqueIdentifier, listingId)
				.query(`
					SELECT TOP 1 ${idColumn} AS listing_id
					FROM ${table}
					WHERE ${idColumn} = @listing_id;
				`);

			if (!updated.recordset?.[0]) {
				await tx.rollback();
				return res.status(404).json({ msg: 'Listing not found.' });
			}

			if (decision === 'approved') {
				await createRequest(tx)
					.input('listing_id', sql.UniqueIdentifier, listingId)
					.query(`
						UPDATE ${table}
						SET status = 'approved', is_listed = 1
						WHERE ${idColumn} = @listing_id;
					`);
			} else {
				await createRequest(tx)
					.input('listing_id', sql.UniqueIdentifier, listingId)
					.query(`DELETE FROM ${table} WHERE ${idColumn} = @listing_id;`);
			}

			if (actorId) {
				await createRequest(tx)
					.input('user_id', sql.UniqueIdentifier, actorId)
					.input('action_type', sql.NVarChar(80), `admin_review_listing_${listingType}_${decision}`)
					.input('reference_table', sql.NVarChar(80), table.replace('dbo.', ''))
					.input('reference_id', sql.UniqueIdentifier, listingId)
					.query(`
						INSERT INTO dbo.USERACTIVITIES (user_id, action_type, reference_table, reference_id)
						VALUES (@user_id, @action_type, @reference_table, @reference_id);
					`);
			}

			await tx.commit();
			return res.json({ msg: 'Listing reviewed successfully.' });
		} catch (err) {
			if (tx._aborted !== true) await tx.rollback();
			throw err;
		}
	} catch (error) {
		return res.status(500).json({ msg: 'Failed to review listing', error: String(error.message || error) });
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
				sp.payment_date,
				sp.payment_ref
			FROM dbo.SUBSCRIPTIONPAYMENTS sp
			LEFT JOIN dbo.USERS u ON u.user_id = sp.user_id
			ORDER BY sp.payment_date DESC;
		`);
		const rows = (result.recordset || []).map((row) => {
			const refText = String(row.payment_ref || '');
			const parts = refText.split('|').reduce((acc, part) => {
				const [k, ...rest] = part.split(':');
				if (!k || rest.length === 0) return acc;
				acc[k.trim().toUpperCase()] = rest.join(':').trim();
				return acc;
			}, {});

			return {
				...row,
				bkash_number: parts.BKASH || null,
				transaction_reference: parts.REF || row.payment_ref || null,
			};
		});

		return res.json(rows);
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
