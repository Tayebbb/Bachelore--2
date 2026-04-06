import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function StudentTuitionPage() {
  const [rows, setRows] = useState([]);

  const load = async () => {
    try {
      const { data } = await api.get('/api/student/tuitions');
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const apply = async (tuitionId) => {
    try {
      await api.post(`/api/student/tuitions/${tuitionId}/apply`);
      load();
    } catch {
      // ignore for now
    }
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">Approved Tuitions</h2>
        <p className="panel-page-subtitle">Browse approved tuition posts and apply directly.</p>
      </header>

      <div className="panel-block">
          <div className="panel-table-wrap">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Salary</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.tuition_id}>
                    <td>{row.subject}</td>
                    <td>{Number(row.salary || 0).toLocaleString()}</td>
                    <td>{row.location}</td>
                    <td>{row.status}</td>
                    <td>
                      <button type="button" className="panel-btn-sm primary" onClick={() => apply(row.tuition_id)}>
                        Apply
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="panel-empty">No approved tuition listings available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
