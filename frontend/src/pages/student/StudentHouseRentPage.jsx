import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function StudentHouseRentPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/student/house-rent');
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setRows([]);
      }
    };
    load();
  }, []);

  const contact = async (houseId) => {
    try {
      await api.post('/api/student/house-rent/contact', { houseId, message: 'I am interested in this listing.' });
    } catch {
      // ignore
    }
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">House Rent</h2>
        <p className="panel-page-subtitle">Browse verified rent listings and contact owners directly.</p>
      </header>
      <div className="panel-block">
        <div className="panel-table-wrap">
          <table className="table-modern">
            <thead><tr><th>Location</th><th>Rent</th><th>Rooms</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.house_id}>
                  <td>{r.location}</td><td>{r.rent}</td><td>{r.rooms}</td><td>{r.status}</td>
                  <td><button type="button" className="panel-btn-sm primary" onClick={() => contact(r.house_id)}>Apply / Book</button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="panel-empty">No approved house listings.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
