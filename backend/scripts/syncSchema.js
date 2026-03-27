import { db } from '../db/models.js';

async function main() {
  try {
    await db.sequelize.authenticate();
    await db.sequelize.sync({ alter: true });
    console.log('Schema synchronized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Schema synchronization failed:', error.message);
    process.exit(1);
  }
}

main();
