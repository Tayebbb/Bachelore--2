import React, { useMemo, useState } from 'react';
import ModuleBoard from '../components/ModuleBoard.jsx';

const data = [
  { id: 'h1', title: '2 Bed Flat Near Campus', location: 'Mohammadpur', price: '15000 BDT', status: 'Approved', contact: '017XXXXXXXX' },
  { id: 'h2', title: 'Studio for Single Student', location: 'Uttara', price: '9500 BDT', status: 'Pending', contact: '018XXXXXXXX' },
  { id: 'h3', title: 'Shared Flat (3 Students)', location: 'Dhanmondi', price: '18000 BDT', status: 'Booked', contact: '019XXXXXXXX' },
];

export default function HouseRentModern() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('latest');

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((item) => {
      const matchesQ = !q || `${item.title} ${item.location} ${item.contact}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || item.status.toLowerCase().includes(filter);
      return matchesQ && matchesFilter;
    });
  }, [search, filter]);

  return (
    <ModuleBoard
      title="House Rent Listings"
      subtitle="Verified listings with contact and inquiry pipeline"
      items={items}
      filter={filter}
      setFilter={setFilter}
      sort={sort}
      setSort={setSort}
      search={search}
      setSearch={setSearch}
      onReset={() => {
        setSearch('');
        setFilter('all');
        setSort('latest');
      }}
    />
  );
}
