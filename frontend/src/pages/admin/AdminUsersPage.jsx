import React, { useEffect, useState } from 'react';
import api from '../../components/axios.jsx';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);

  const load = async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleBlock = async (u) => {
    try {
      await api.patch(`/api/admin/users/${u.user_id}/status`, {
        isBlocked: !u.is_blocked,
        blockReason: !u.is_blocked ? 'Blocked by admin' : null,
      });
      load();
    } catch {
      // ignore for now
    }
  };

  return (
    <div className="panel-page">
      <header className="panel-page-header">
        <h2 className="panel-page-title">User Management</h2>
        <p className="panel-page-subtitle">Update, block, and monitor all users from database records.</p>
      </header>

      <div className="panel-block">
          <div className="panel-table-wrap">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <span className={`badge-status ${u.is_blocked ? 'badge-rejected' : 'badge-approved'}`}>
                        {u.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button className={`panel-btn-sm ${u.is_blocked ? 'success' : 'danger'}`} onClick={() => toggleBlock(u)} type="button">
                        {u.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="panel-empty">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
