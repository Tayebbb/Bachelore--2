import React, { useMemo, useState } from 'react';
import ModuleBoard from '../components/ModuleBoard.jsx';

const data = [
  { id: 'r1', title: 'Host: 2 Seats Available', location: 'Farmgate', price: '5500 BDT', status: 'Pending', contact: '017XXXXXXXX' },
  { id: 'r2', title: 'Seeker: CSE Student', location: 'Shyamoli', price: '5000 BDT', status: 'Approved', contact: '018XXXXXXXX' },
  { id: 'r3', title: 'Host: Shared Flat', location: 'Mirpur', price: '6000 BDT', status: 'Booked', contact: '019XXXXXXXX' },
];

export default function RoommatesModern() {
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
      title="Roommate Finder"
      subtitle="Host listings, seeker applications, and booking workflow"
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
