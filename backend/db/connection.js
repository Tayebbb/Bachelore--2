
import dotenv from 'dotenv';
dotenv.config();
import sql from 'mssql';

const dbConfig = {
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'BACHELORE',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 1433,
  connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 4000),
  requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT_MS || 12000),
  options: {
    trustServerCertificate: true,
    encrypt: false,
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

console.log('MSSQL dbConfig:', dbConfig);

let poolPromise = null;

export async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig).catch((err) => {
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
