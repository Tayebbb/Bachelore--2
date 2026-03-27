import React from 'react';
import { motion } from 'framer-motion';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from 'recharts';

const kpis = [
  { id: 'applications', label: 'Total Applications', value: '1,284', delta: '+18%' },
  { id: 'bookings', label: 'Active Bookings', value: '326', delta: '+9%' },
  { id: 'payments', label: 'Completed Payments', value: '892', delta: '+26%' },
  { id: 'response', label: 'Avg API Response', value: '62ms', delta: '-12%' },
];

const trendData = [
  { name: 'Mon', applications: 120, bookings: 44 },
  { name: 'Tue', applications: 146, bookings: 56 },
  { name: 'Wed', applications: 112, bookings: 48 },
  { name: 'Thu', applications: 170, bookings: 68 },
  { name: 'Fri', applications: 184, bookings: 70 },
  { name: 'Sat', applications: 164, bookings: 65 },
  { name: 'Sun', applications: 150, bookings: 58 },
];

const timeline = [
  'Tuition booking approved for CSE tutor in Dhanmondi',
  'House listing verified by admin (Mirpur 10)',
  'Marketplace item marked sold with payment completed',
  'Roommate host profile activated after review',
  'Subscription renewed for 30 days',
];

export default function Dashboard() {
  return (
    <>
      <section className="grid-two">
        {kpis.map((kpi, index) => (
          <motion.article
            key={kpi.id}
            className="surface-card metric-card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <small className="text-secondary">{kpi.label}</small>
            <h3 className="mb-1 mt-1">{kpi.value}</h3>
            <span className="text-success fw-semibold">{kpi.delta} this week</span>
          </motion.article>
        ))}
      </section>

      <section className="grid-two">
        <article className="surface-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Applications vs Bookings</h5>
            <small className="text-secondary">Last 7 days</small>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="applications" stroke="#0e8ef5" strokeWidth={3} />
              <Line type="monotone" dataKey="bookings" stroke="#25d0b2" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="surface-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Revenue Momentum</h5>
            <small className="text-secondary">BDT (x1000)</small>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0e8ef5" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#0e8ef5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="applications" stroke="#0e8ef5" fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="surface-card">
        <h5 className="mb-3">Activity Timeline</h5>
        <div>
          {timeline.map((event) => (
            <div key={event} className="timeline-item">
              <p className="mb-1">{event}</p>
              <small className="text-secondary">Just now</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
