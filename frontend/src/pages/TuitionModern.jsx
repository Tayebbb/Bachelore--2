import React, { useMemo, useState } from 'react';
import ModuleBoard from '../components/ModuleBoard.jsx';

const data = [
  { id: 't1', title: 'HSC Physics Tutor', location: 'Dhanmondi', price: '8000 BDT', status: 'Pending', contact: '017XXXXXXXX' },
  { id: 't2', title: 'CSE Algorithm Mentor', location: 'Mohammadpur', price: '12000 BDT', status: 'Approved', contact: '018XXXXXXXX' },
  { id: 't3', title: 'English Language Tutor', location: 'Mirpur', price: '7000 BDT', status: 'Booked', contact: '019XXXXXXXX' },
];

export default function TuitionModern() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('latest');

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = data.filter((item) => {
      const matchesQ = !q || `${item.title} ${item.location} ${item.contact}`.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || item.status.toLowerCase().includes(filter);
      return matchesQ && matchesFilter;
    });

    if (sort === 'priceAsc') rows = [...rows].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'priceDesc') rows = [...rows].sort((a, b) => Number(b.price) - Number(a.price));
    return rows;
  }, [search, filter, sort]);

  return (
    <ModuleBoard
      title="Tuition Marketplace"
      subtitle="Browse, apply, track applications, and monitor bookings"
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
