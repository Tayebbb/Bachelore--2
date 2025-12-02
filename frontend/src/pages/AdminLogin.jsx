import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_CODE = "choton2025";

export default function AdminLogin() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminCode: code }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("adminToken", data.token);
        // set a fallback admin user id so AdminDashboard can post listings
        // backend expects an ownerId; admin actions use adminCode/JWT for authorization
        localStorage.setItem(
          "adminUserId",
          localStorage.getItem("adminUserId") || "admin"
        );
        navigate("/admin-dashboard");
      } else {
        setError(data.msg || "Invalid admin code.");
      }
    } catch (err) {
      setError("Network error");
    }
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
            <label htmlFor="adminCode" className="form-label">
              Admin Code
            </label>
            <input
              type="password"
              className="form-control"
              id="adminCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
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
