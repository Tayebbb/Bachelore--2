import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRouter);

app.get('/', (_req, res) => {
  res.json({ name: 'BacheLORE API', status: 'ok' });
});

export default app;
