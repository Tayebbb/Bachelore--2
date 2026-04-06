import jwt from 'jsonwebtoken';
import { getPool } from '../db/connection.js';
import { ADMIN_CODE, JWT_SECRET } from '../utils/auth.js';

export const adminLogin = async (req, res) => {
  const { adminCode } = req.body;
  if (adminCode !== ADMIN_CODE) {
    return res.status(401).json({ msg: 'Invalid admin code' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 1 user_id
      FROM dbo.USERS
      WHERE LOWER(role) = 'admin'
      ORDER BY created_at ASC;
    `);

    const adminUserId = result.recordset?.[0]?.user_id || null;
    if (!adminUserId) {
      return res.status(500).json({ msg: 'No admin user exists in the database.' });
    }

    const token = jwt.sign({ role: 'admin', user_id: adminUserId }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  } catch (error) {
    return res.status(500).json({ msg: 'Failed to login admin.', error: String(error.message || error) });
  }
};
