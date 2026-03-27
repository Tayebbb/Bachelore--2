import React from 'react';
import { motion } from 'framer-motion';
import StatusBadge from './StatusBadge.jsx';

export default function ModuleBoard({
  title,
  subtitle,
  items,
  filter,
  setFilter,
  sort,
  setSort,
  search,
  setSearch,
  onReset,
}) {
  return (
    <div className="surface-card">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h5 className="mb-1">{title}</h5>
          <small className="text-secondary">{subtitle}</small>
        </div>
        <span className="text-secondary">{items.length} results</span>
      </div>

      <div className="filter-bar mb-3">
        <div className="field wide">
          <input
            className="app-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, location, or contact"
          />
        </div>
        <div className="field">
          <select className="app-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="booked">Booked</option>
          </select>
        </div>
        <div className="field">
          <select className="app-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="latest">Latest</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
          </select>
        </div>
        <div className="field d-grid">
          <button className="btn-soft" onClick={onReset} type="button">Reset</button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Price</th>
              <th>Status</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <td>{item.title}</td>
                <td>{item.location}</td>
                <td>{item.price}</td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td>{item.contact}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
