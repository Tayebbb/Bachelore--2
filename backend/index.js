import dotenv from 'dotenv';
import app from './app.js';

import { getPool } from './db/connection.js';
import { ensureSchema } from './db/schema.js';
import { connectDatabase } from './config/database.js';

dotenv.config();

console.log('DB_USER:', process.env.DB_USER, 'DB_PASSWORD:', process.env.DB_PASSWORD);

async function bootstrap() {
  try {
    await getPool();
    await ensureSchema();
    await connectDatabase();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server bootstrap failed:', err);
    process.exit(1);
  }
}

bootstrap();
