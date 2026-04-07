import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api.js';
import activityRouter from './routes/activity.js';
import adminRouter from './routes/admin.js';
import studentRouter from './routes/student.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRouter);
app.use('/api/activity', activityRouter); // New: mount activity router
app.use('/api/admin', adminRouter);
app.use('/api/student', studentRouter);

app.get('/', (_req, res) => {
  res.json({ name: 'BacheLORE API', status: 'ok' });
});

export default app;
