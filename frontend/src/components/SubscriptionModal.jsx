import React, { useState } from "react";
import api from "./axios.jsx";
import PopupMessage from "./PopupMessage.jsx";

export default function SubscriptionModal({ show, onClose, onSuccess }) {
  const [bkashNumber, setBkashNumber] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [bkashError, setBkashError] = useState("");
  const [popup, setPopup] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const validateBkash = (value) => /^01\d{9}$/.test(String(value || "").trim());

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bkashNumber.trim() || !reference.trim()) {
      setPopup({
        show: true,
        message: "Please fill in all fields",
        type: "error",
      });
      return;
    }

    if (!validateBkash(bkashNumber)) {
      setBkashError("BKash number must be 11 digits and start with 01.");
      return;
    }

    setBkashError("");
    setLoading(true);

    try {
      await api.post("/api/student/subscription/pay", {
        bkashNumber,
        reference,
        amount: 99,
        paymentMethod: "bkash",
      });

      setPopup({
        show: true,
        message: "Payment Verified! Your subscription is now active.",
        type: "success",
      });

      setTimeout(() => {
        setBkashNumber("");
        setReference("");
        setBkashError("");
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      setPopup({
        show: true,
        message:
          error.response?.data?.msg || "Payment failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <PopupMessage
        message={popup.message}
        show={popup.show}
        duration={3000}
        onClose={() => setPopup({ ...popup, show: false })}
      />

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.5em", fontWeight: 600 }}>
            Subscribe Now
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5em",
              cursor: "pointer",
              color: "#999",
            }}
          >
            �
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 500,
                color: "#333",
              }}
            >
              BKash Number
            </label>
            <input
              type="text"
              value={bkashNumber}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, "").slice(0, 11);
                setBkashNumber(cleaned);
                if (cleaned.length === 0 || validateBkash(cleaned)) {
                  setBkashError("");
                }
              }}
              placeholder="Enter your BKash number"
              disabled={loading}
              inputMode="numeric"
              maxLength={11}
              style={{
                width: "100%",
                padding: "12px",
                border: bkashError ? "1px solid #dc3545" : "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "1em",
                fontFamily: "inherit",
                boxSizing: "border-box",
                opacity: loading ? 0.6 : 1,
              }}
            />
            {bkashError && (
              <div
                style={{
                  marginTop: "8px",
                  color: "#dc3545",
                  fontSize: "0.9em",
                  fontWeight: 500,
                }}
              >
                {bkashError}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 500,
                color: "#333",
              }}
            >
              Transaction Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Enter your transaction reference"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "1em",
                fontFamily: "inherit",
                boxSizing: "border-box",
                opacity: loading ? 0.6 : 1,
              }}
            />
          </div>

          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "16px",
              borderRadius: "6px",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            <p
              style={{ margin: "0 0 8px 0", color: "#666", fontSize: "0.9em" }}
            >
              Monthly Subscription
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "1.8em",
                fontWeight: 700,
                color: "#333",
              }}
            >
              ? 99
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 24px",
                backgroundColor: loading ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "1em",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Processing..." : "Submit Payment"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 24px",
                backgroundColor: "#f0f0f0",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "1em",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
