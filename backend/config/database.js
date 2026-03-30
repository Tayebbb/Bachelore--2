import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import tedious from 'tedious';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME || 'BACHELORE',
  username: process.env.DB_USER || 'bachelore_user',
  password: process.env.DB_PASSWORD || '',
  instanceName: process.env.DB_INSTANCE || 'SQLEXPRESS',
};

const useInstance = Boolean(dbConfig.instanceName);

function createSequelizeOptions(databaseName) {
  const options = {
    host: dbConfig.host,
    dialect: 'mssql',
    dialectModule: tedious,
    logging: false,
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  };

  if (useInstance) {
    options.dialectOptions.options.instanceName = dbConfig.instanceName;
  } else {
    options.port = dbConfig.port;
  }

  return {
    databaseName,
    options,
  };
}

export async function ensureDatabaseExists() {
  const { databaseName, options } = createSequelizeOptions('master');
  const adminSequelize = new Sequelize(databaseName, dbConfig.username, dbConfig.password, options);

  try {
    await adminSequelize.authenticate();
    const safeDbName = dbConfig.database.replace(/]/g, ']]');
    await adminSequelize.query(`IF DB_ID(N'${safeDbName}') IS NULL CREATE DATABASE [${safeDbName}];`);
  } finally {
    await adminSequelize.close();
  }
}

const { options: sequelizeOptions } = createSequelizeOptions(dbConfig.database);
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, sequelizeOptions);

export default sequelize;

export async function connectDatabase() {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    console.log('MSSQL connection established successfully.');

    await sequelize.sync({ alter: false, force: false });
    console.log('Sequelize models synchronized with MSSQL (no alter, no force).');
  } catch (error) {
    console.error('MSSQL connection or sync failed:', {
      message: error?.message,
      name: error?.name,
      code: error?.original?.code || error?.code,
      stack: error?.stack,
    });
    throw error;
  }
}
