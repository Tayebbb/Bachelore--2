import React, { useState, useEffect } from "react";
import axios from "../components/axios";
import { getUser } from "../lib/auth";

export default function HouseRent() {
  const [locationFilter, setLocationFilter] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/house-rent")
      .then((res) => {
        setListings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load listings");
        setLoading(false);
      });
  }, []);

  const filtered = listings.filter((l) => {
    if (!locationFilter) return true;
    const q = locationFilter.trim().toLowerCase();
    return (
      (l.location || "").toLowerCase().includes(q) ||
      (l.title || "").toLowerCase().includes(q) ||
      (l.description || "").toLowerCase().includes(q)
    );
  });

  return (
    <main className="house-rent-page container-fluid py-4">
      <div className="container px-0">
        <div className="d-flex flex-column flex-md-row align-items-start justify-content-between mb-3 px-3">
          <div className="mb-2 mb-md-0">
            <h4 className="mb-0">{filtered.length} offers found</h4>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <input
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="form-control form-control-sm"
              style={{ minWidth: 200 }}
              placeholder="Filter by location/title"
            />
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setLocationFilter("")}
            >
              Clear
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">Loading listings...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="row g-4">
            {filtered.map((l) => (
              <div key={l._id || l.id} className="col-md-6">
                <article className="job-card">
                  <div className="job-card-inner">
                    <h5 className="job-title">{l.title}</h5>
                    <div className="small muted mb-2">
                      <span>
                        <strong>Location:</strong> {l.location}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        <strong>Price:</strong> {l.price}
                      </span>
                      {l.rooms !== undefined && (
                        <>
                          <span className="mx-2">•</span>
                          <span>
                            <strong>Rooms:</strong> {l.rooms}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          const ev = new CustomEvent("openHouseContact", {
                            detail: { listing: l },
                          });
                          window.dispatchEvent(ev);
                        }}
                      >
                        Contact
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => {
                          const ev = new CustomEvent("openHouseDetails", {
                            detail: { listing: l },
                          });
                          window.dispatchEvent(ev);
                        }}
                      >
                        Description
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>

      <HouseContactModal />
      <HouseDetailsModal />
    </main>
  );
}

function HouseContactModal() {
  const [visible, setVisible] = useState(false);
  const [listing, setListing] = useState(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const handler = (e) => {
      setListing(e.detail.listing);
      setVisible(true);
      setMessage("");
      setStatus("");
    };
    window.addEventListener("openHouseContact", handler);
    return () => window.removeEventListener("openHouseContact", handler);
  }, []);

  const submit = async () => {
    const user = getUser();
    if (!user) {
      setStatus("Please login to contact the owner.");
      return;
    }
    if (!message.trim()) {
      setStatus("Please enter a message.");
      return;
    }
    setStatus("Sending...");
    try {
      const payload = {
        senderId: user._id || user.id || user._id,
        receiverId: listing.ownerRef || listing.owner || null,
        message,
      };
      await axios.post("/api/house-rent/contact", payload);
      setStatus("Message sent.");
      setTimeout(() => {
        setVisible(false);
        setStatus("");
      }, 1200);
    } catch (err) {
      setStatus("Failed to send message");
    }
  };

  if (!visible || !listing) return null;
  return (
    <div
      className="modal-backdrop p-4"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
      }}
    >
      <div className="card p-3" style={{ width: 480, maxWidth: "94%" }}>
        <h5 className="mb-2">Contact owner: {listing.title}</h5>
        <div className="small text-muted mb-2">
          Owner contact: {listing.contact || <em>Not provided</em>}
        </div>
        <textarea
          className="form-control mb-2"
          placeholder="Your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="d-flex gap-2 justify-content-end">
          <button
            className="btn btn-secondary"
            onClick={() => setVisible(false)}
          >
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit}>
            Send
          </button>
        </div>
        {status && <div className="mt-2 small muted">{status}</div>}
      </div>
    </div>
  );
}

function HouseDetailsModal() {
  const [visible, setVisible] = useState(false);
  const [listing, setListing] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      setListing(e.detail.listing);
      setVisible(true);
    };
    window.addEventListener("openHouseDetails", handler);
    return () => window.removeEventListener("openHouseDetails", handler);
  }, []);

  if (!visible || !listing) return null;
  return (
    <div
      className="modal-backdrop p-4"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
        background: "rgba(0,0,0,0.18)",
      }}
    >
      <div
        className="card p-4 shadow-lg border-0"
        style={{ width: 520, maxWidth: "98%", borderRadius: 12 }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-0 fw-bold">{listing.title}</h5>
            <div className="small text-muted">
              {new Date(listing.createdAt).toLocaleDateString()}
            </div>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setVisible(false)}
            style={{ fontSize: 22, lineHeight: 1 }}
          >
            &times;
          </button>
        </div>
        <div
          className="mb-3 px-2 py-2 rounded-3"
          style={{ background: "#fff", border: "1px solid #e9eef6" }}
        >
          <div className="mb-2">
            <span className="fw-semibold">Location:</span> {listing.location}
          </div>
          <div className="mb-2">
            <span className="fw-semibold">Price:</span> {listing.price}
          </div>
          {listing.rooms !== undefined && (
            <div className="mb-2">
              <span className="fw-semibold">Rooms:</span> {listing.rooms}
            </div>
          )}
          <div className="mb-2">
            <span className="fw-semibold">Contact:</span>{" "}
            <span style={{ color: "#1971c2" }}>
              {listing.contact || "(Not provided)"}
            </span>
          </div>
          <div className="mb-2">
            <span className="fw-semibold">Description:</span>{" "}
            <span style={{ color: "#444" }}>{listing.description}</span>
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-end mt-3">
          <button
            className="btn btn-primary px-4"
            onClick={() => {
              setVisible(false);
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent("openHouseContact", { detail: { listing } })
                );
              }, 200);
            }}
          >
            Contact
          </button>
          <button
            className="btn btn-outline-secondary px-4"
            onClick={() => setVisible(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
