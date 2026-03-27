import React, { useMemo, useState } from 'react';
import ModuleBoard from '../components/ModuleBoard.jsx';

const data = [
  { id: 'm1', title: 'Part-time Home Cleaning', location: 'Badda', price: '300/hr', status: 'Pending', contact: '017XXXXXXXX' },
  { id: 'm2', title: 'Weekend Kitchen Support', location: 'Uttara', price: '350/hr', status: 'Approved', contact: '018XXXXXXXX' },
  { id: 'm3', title: 'Laundry + Cleaning', location: 'Dhanmondi', price: '320/hr', status: 'Booked', contact: '019XXXXXXXX' },
];

export default function MaidsModern() {
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
      title="Maid Services"
      subtitle="Apply, approve, and book domestic help with status tracking"
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
