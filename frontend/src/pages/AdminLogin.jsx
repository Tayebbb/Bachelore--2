import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_EMAIL = "chudpaglu@gmail.com";
const ADMIN_PASS = "chudpaglu";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Require the specific credentials provided
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      // mark admin locally (mock authentication)
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("adminToken", "local-admin-token");
      localStorage.setItem(
        "adminUserId",
        localStorage.getItem("adminUserId") || "admin"
      );
      navigate("/admin-dashboard");
      return;
    }

    setError("Invalid admin credentials.");
  };

  return (
    <div
      className="container d-flex flex-column justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="card p-4" style={{ maxWidth: 400, width: "100%" }}>
        <h2 className="mb-3 text-center">Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="adminEmail" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="adminEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="adminPass" className="form-label">
              Password
            </label>
            <input
              type="password"
              className="form-control"
              id="adminPass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
