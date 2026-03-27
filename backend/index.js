import dotenv from 'dotenv';
import app from './app.js';
import { getPool } from './db/connection.js';
import { ensureSchema } from './db/schema.js';

dotenv.config();

async function bootstrap() {
  try {
    await getPool();
    await ensureSchema();
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
