import dotenv from 'dotenv';
import app from './app.js';

import { getPool } from './db/connection.js';
import { ensureSchema } from './db/schema.js';
import { connectDatabase } from './config/database.js';

dotenv.config({ override: true });

async function bootstrap() {
  const PORT = process.env.PORT || 5000;
  const retries = Number(process.env.DB_BOOT_RETRIES || 2);
  const retryDelayMs = Number(process.env.DB_BOOT_RETRY_DELAY_MS || 2000);
  const strictDbStartup = String(process.env.STRICT_DB_STARTUP || 'false').toLowerCase() === 'true';

  let dbReady = false;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await getPool();
      await ensureSchema();
      await connectDatabase();
      dbReady = true;
      break;
    } catch (err) {
      const remaining = retries - attempt;
      console.error(`DB bootstrap attempt ${attempt + 1} failed:`, err?.message || err);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  if (!dbReady) {
    const msg = 'Database is unreachable. Starting API in degraded mode.';
    if (strictDbStartup) {
      console.error(`${msg} Set STRICT_DB_STARTUP=false to allow startup without DB.`);
      process.exit(1);
    }
    console.warn(msg);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}${dbReady ? '' : ' (degraded mode)'}`);
  });
}

bootstrap();
