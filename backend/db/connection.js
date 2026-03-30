
import dotenv from 'dotenv';
dotenv.config();
import sql from 'mssql';

const dbConfig = {
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'BACHELORE',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 1433,
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
    poolPromise = sql.connect(dbConfig);
  }
  return poolPromise;
}

export function createRequest(poolOrTransaction) {
  return poolOrTransaction.request();
}

export { sql };
