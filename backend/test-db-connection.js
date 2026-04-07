import dotenv from 'dotenv';
dotenv.config({ override: true });
import sql from 'mssql';

function normalizeSqlEndpoint(rawHost, rawInstance) {
  const hostInput = String(rawHost || '').trim();
  const instanceInput = String(rawInstance || '').trim();
  const lowerHost = hostInput.toLowerCase();

  if (lowerHost === 'sqlexpress' || lowerHost === '.\\sqlexpress' || lowerHost === '(local)\\sqlexpress') {
    return { server: '100.111.12.54', instanceName: instanceInput || 'SQLEXPRESS' };
  }

  if (hostInput.includes('\\')) {
    const [serverPart, instancePart] = hostInput.split('\\');
    return {
      server: serverPart || '100.111.12.54',
      instanceName: instanceInput || instancePart || undefined,
    };
  }

  return {
    server: hostInput || '100.111.12.54',
    instanceName: instanceInput || undefined,
  };
}

async function testConnection() {
  try {
    console.log('Attempting connection with config:');
    const dbPortFromEnv = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
    const normalizedEndpoint = normalizeSqlEndpoint(process.env.DB_HOST, process.env.DB_INSTANCE);
    const config = {
      server: normalizedEndpoint.server,
      ...(dbPortFromEnv ? { port: dbPortFromEnv } : {}),
      database: process.env.DB_NAME || 'BACHELORE',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        ...(!dbPortFromEnv && normalizedEndpoint.instanceName ? { instanceName: normalizedEndpoint.instanceName } : {}),
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
