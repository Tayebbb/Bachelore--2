import dotenv from 'dotenv';
dotenv.config();
import sql from 'mssql';

async function testConnection() {
  try {
    console.log('Attempting connection with config:');
    const dbPortFromEnv = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
    const config = {
      server: process.env.DB_HOST || 'localhost',
      ...(dbPortFromEnv ? { port: dbPortFromEnv } : {}),
      database: process.env.DB_NAME || 'BACHELORE',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        ...(!dbPortFromEnv && process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
      },
    };
    console.log(JSON.stringify(config, null, 2));
    
    const pool = await sql.connect(config);
    console.log('✓ Connection successful!');
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('✗ Connection failed:');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    process.exit(1);
  }
}

testConnection();
