
import dotenv from "dotenv";
import { connectDatabase } from './db/database.js';
import app from './app.js';

dotenv.config();

connectDatabase()
  .then(() => {
    console.log('MSSQL Connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
