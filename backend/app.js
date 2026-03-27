import express from 'express';
import cors from 'cors';

import subscriptionRoutes from './routes/subscription.js';
import marketplaceRoutes from './routes/marketplace.js';
import signupRoutes from './routes/signup.js';
import loginRoutes from './routes/login.js';
import announcementRoutes from './routes/announcements.js';
import tuitionRoutes from './routes/tuitions.js';
import adminRoutes from './routes/admin.js';
import appliedTuitionsRoutes from './routes/appliedTuitions.js';
import bookedTuitionsRoutes from './routes/bookedTuitions.js';
import maidsRoutes from './routes/maids.js';
import appliedMaidsRoutes from './routes/appliedMaids.js';
import bookedMaidsRoutes from './routes/bookedMaids.js';
import roommateRoutes from './routes/roommates.js';
import houseRentRoutes from './routes/houseRent.js';
import activityRoutes from './routes/activity.js';
import notificationRoutes from './routes/notifications.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/signup', signupRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/tuitions', tuitionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/applied-tuitions', appliedTuitionsRoutes);
app.use('/api/booked-tuitions', bookedTuitionsRoutes);
app.use('/api/maids', maidsRoutes);
app.use('/api/applied-maids', appliedMaidsRoutes);
app.use('/api/booked-maids', bookedMaidsRoutes);
app.use('/api/roommates', roommateRoutes);
app.use('/api/house-rent', houseRentRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  const port = process.env.PORT || 5000;
  res.json({ ok: true, port, database: 'mssql-sequelize' });
});

export default app;
