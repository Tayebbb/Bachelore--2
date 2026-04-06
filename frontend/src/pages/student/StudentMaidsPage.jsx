import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function StudentMaidsPage() {
  const [rows, setRows] = useState([]);

  const load = async () => {
    try {
      const { data } = await api.get('/api/student/maids');
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const apply = async (maidId) => {
    try {
      await api.post(`/api/student/maids/${maidId}/apply`);
    } catch {
      // ignore
    }
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Maid Services</h2>
        <p className="panel-page-subtitle">Find approved maid listings and apply instantly.</p>
      </header>
      <div className="panel-block">
        <div className="panel-table-wrap">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Location</th>
                <th>Salary</th>
                <th>Availability</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.maid_id}>
                  <td>{row.location}</td>
                  <td>{row.salary}</td>
                  <td>{row.availability}</td>
                  <td>{row.status}</td>
                  <td><button type="button" className="panel-btn-sm primary" onClick={() => apply(row.maid_id)}>Apply</button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="panel-empty">No approved maid listing found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
