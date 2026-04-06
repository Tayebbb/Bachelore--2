import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function StudentActivitiesPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/student/activities');
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setRows([]);
      }
    };
    load();
  }, []);

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">My Activities</h2>
        <p className="panel-page-subtitle">Auto-generated activity log from database triggers and tracked actions.</p>
      </header>

      <div className="panel-block">
          <div className="panel-table-wrap">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Reference</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.activity_id}>
                    <td>{row.action_type}</td>
                    <td>{row.reference_table}</td>
                    <td>{row.reference_id || '-'}</td>
                    <td>{new Date(row.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="panel-empty">No activity recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
