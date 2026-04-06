import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function StudentMarketplacePage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ title: '', price: '', condition: 'used' });

  const load = async () => {
    try {
      const { data } = await api.get('/api/student/marketplace');
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const postItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/student/marketplace', form);
      setForm({ title: '', price: '', condition: 'used' });
      load();
    } catch {
      // ignore
    }
  };

  const buy = async (itemId) => {
    try {
      await api.post(`/api/student/marketplace/${itemId}/buy`);
      load();
    } catch {
      // ignore
    }
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Marketplace</h2>
        <p className="panel-page-subtitle">Post items quickly and buy from active student listings.</p>
      </header>
      <div className="panel-split panel-split-4-8">
        <div>
          <div className="panel-block">
              <h5 className="panel-block-title">Post Item</h5>
              <form onSubmit={postItem} className="panel-form">
                <input className="app-input" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                <input className="app-input" placeholder="Price" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
                <select className="app-select" value={form.condition} onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))}>
                  <option value="used">Used</option>
                  <option value="good">Good</option>
                  <option value="new">New</option>
                </select>
                <button type="submit" className="btn-primary">Post</button>
              </form>
          </div>
        </div>
        <div>
          <div className="panel-block">
            <div className="panel-table-wrap">
              <table className="table-modern">
                <thead><tr><th>Title</th><th>Price</th><th>Condition</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.item_id}>
                      <td>{r.title}</td><td>{r.price}</td><td>{r.condition}</td><td>{r.status}</td>
                      <td><button type="button" className="panel-btn-sm success" onClick={() => buy(r.item_id)}>Apply / Book</button></td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={5} className="panel-empty">No marketplace data.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
