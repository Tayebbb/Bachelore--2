
import { getPool, sql } from './db/connection.js';

(async () => {
  try {
    const pool = await getPool();
    const res = await pool.request().query("SELECT user_id, name, email, role FROM dbo.USERS;");
    console.log("All Users and Roles:");
    console.table(res.recordset);
    process.exit(0);
  } catch (err) {
    console.error("Error fetching users:", err);
    process.exit(1);
  }
})();
