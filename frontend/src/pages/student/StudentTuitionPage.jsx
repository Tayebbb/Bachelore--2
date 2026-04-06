import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';
import PopupMessage from '../../components/PopupMessage.jsx';

export default function StudentTuitionPage() {
  const [rows, setRows] = useState([]);
  const [popup, setPopup] = useState({ show: false, message: '' });

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
      setPopup({ show: true, message: 'Request submitted for approval!' });
      load();
    } catch {
      setPopup({ show: true, message: 'Failed to submit request.' });
    }
  };

  return (
    <div className="panel-page">
      <PopupMessage message={popup.message} show={popup.show} onClose={() => setPopup({ ...popup, show: false })} />
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
                      {String(row.status).toLowerCase() === 'pending' || String(row.status).toLowerCase() === 'applied' ? (
                        <button type="button" className="panel-btn-sm" style={{ background: '#ccc', color: '#888', cursor: 'not-allowed', opacity: 0.7 }} disabled>
                          Applied
                        </button>
                      ) : (
                        <button type="button" className="panel-btn-sm primary" onClick={() => apply(row.tuition_id)}>
                          Apply / Book
                        </button>
                      )}
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
