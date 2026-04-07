
import dotenv from 'dotenv';
dotenv.config();
import sql from 'mssql';

const dbPortFromEnv = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;

const dbConfig = {
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'BACHELORE',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ...(dbPortFromEnv ? { port: dbPortFromEnv } : {}),
  connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 4000),
  requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT_MS || 12000),
  options: {
    trustServerCertificate: true,
    encrypt: false,
    ...(!dbPortFromEnv && process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

console.log('MSSQL dbConfig:', dbConfig);

let poolPromise = null;
let resolvedConfig = null;

function buildCandidateConfigs() {
  const candidates = [dbConfig];

  if (process.env.DB_INSTANCE && dbPortFromEnv) {
    // If SQL Browser/instance lookup is unavailable, explicit TCP port usually works better.
    const { port, ...withoutPort } = dbConfig;
    candidates.push({
      ...withoutPort,
      options: {
        ...dbConfig.options,
        instanceName: process.env.DB_INSTANCE,
      },
    });
  }

  return candidates;
}

export async function getPool() {
  if (!poolPromise) {
    const candidates = resolvedConfig ? [resolvedConfig] : buildCandidateConfigs();

    poolPromise = (async () => {
      let lastError = null;
      for (const candidate of candidates) {
        try {
          const pool = await sql.connect(candidate);
          resolvedConfig = candidate;
          return pool;
        } catch (err) {
          lastError = err;
        }
      }
      throw lastError || new Error('Unable to establish MSSQL connection.');
    })().catch((err) => {
      // Allow the next request to retry instead of reusing a rejected promise forever.
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

export function createRequest(poolOrTransaction) {
  return poolOrTransaction.request();
}

export { sql };
