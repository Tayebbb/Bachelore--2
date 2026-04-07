import React, { useEffect, useMemo, useState } from "react";
import api from "../components/axios.jsx";
import { getUser } from "../lib/auth";

export default function Profile() {
  const currentUser = useMemo(() => getUser(), []);
  const [payments, setPayments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.user_id) {
        setError("User profile unavailable. Please login again.");
        setLoading(false);
        return;
      }

      try {
        const [paymentRes, activityRes] = await Promise.all([
          api.get(`/api/subscription/payments/${currentUser.user_id}`),
          api.get("/api/activity", { params: { userId: currentUser.user_id } }),
        ]);

        setPayments(Array.isArray(paymentRes.data) ? paymentRes.data : []);
        setActivity(Array.isArray(activityRes.data) ? activityRes.data : []);
      } catch (err) {
        setError(err?.response?.data?.msg || "Failed to load profile details");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser?.user_id]);

  if (loading) {
    return (
      <main className="container py-4">
        <div className="card p-4">Loading profile...</div>
      </main>
    );
  }

  return (
    <main className="container py-4">
      <section className="card mb-4 shadow-sm">
        <div className="card-body">
          <h2 className="h4 mb-3">My Profile</h2>
          {error ? <p className="text-danger mb-0">{error}</p> : null}
          <div className="row g-3">
            <div className="col-md-4">
              <div className="border rounded p-3 h-100">
                <div className="text-muted small">Name</div>
                <div className="fw-semibold">{currentUser?.name || "N/A"}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="border rounded p-3 h-100">
                <div className="text-muted small">Email</div>
                <div className="fw-semibold">{currentUser?.email || "N/A"}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="border rounded p-3 h-100">
                <div className="text-muted small">Role</div>
                <div className="fw-semibold text-capitalize">
                  {currentUser?.role || "student"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="row g-4">
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h3 className="h5 mb-3">Recent Payments</h3>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-muted">
                          No payments yet.
                        </td>
                      </tr>
                    ) : (
                      payments.slice(0, 8).map((payment) => (
                        <tr key={payment.payment_id || payment._id}>
                          <td>
                            <span className="badge bg-primary">
                              {payment.status}
                            </span>
                          </td>
                          <td>{payment.amount}</td>
                          <td>
                            {new Date(payment.payment_date).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h3 className="h5 mb-3">Recent Activity</h3>
              <ul className="list-group list-group-flush">
                {activity.length === 0 ? (
                  <li className="list-group-item text-muted">
                    No activity yet.
                  </li>
                ) : (
                  activity.slice(0, 8).map((entry) => (
                    <li
                      className="list-group-item d-flex justify-content-between"
                      key={entry.activity_id || entry._id}
                    >
                      <span>{entry.action_type}</span>
                      <small className="text-muted">
                        {new Date(entry.timestamp).toLocaleString()}
                      </small>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
