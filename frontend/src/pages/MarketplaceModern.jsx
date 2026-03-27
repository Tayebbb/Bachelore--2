import React, { useMemo, useState } from 'react';
import ModuleBoard from '../components/ModuleBoard.jsx';

const data = [
  { id: 'p1', title: 'Used Graphing Calculator', location: 'BUET Area', price: '3500 BDT', status: 'Pending', contact: '017XXXXXXXX' },
  { id: 'p2', title: 'Gaming Chair', location: 'Mirpur', price: '7000 BDT', status: 'Approved', contact: '018XXXXXXXX' },
  { id: 'p3', title: 'Cycle (Mountain Bike)', location: 'Banani', price: '12000 BDT', status: 'Booked', contact: '019XXXXXXXX' },
];

export default function MarketplaceModern() {
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
      title="Campus Marketplace"
      subtitle="Buy, sell, and track purchase lifecycle"
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
