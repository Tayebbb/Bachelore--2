import { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import bg1image from "../assets/bg1image.jpg";
import "../App.css";
const demoListings = [];

export default function RoommateFinder() {
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [gender, setGender] = useState("");

  const filtered = demoListings.filter((l) => {
    const matchesQ =
      !q ||
      l.title.toLowerCase().includes(q.toLowerCase()) ||
      l.location.toLowerCase().includes(q.toLowerCase());
    const matchesArea = !area || l.location.toLowerCase().includes(area.toLowerCase());
    const matchesRent = !maxRent || l.rent <= Number(maxRent);
    const matchesGender = !gender || l.genderPref === gender || l.genderPref === "Any";
    return matchesQ && matchesArea && matchesRent && matchesGender;
  });

  return (
    <>
      <img src={bg1image} alt="Background" className="background-image" />
      <div className="app-container">
        <Navbar />

        <main className="rm-page">
          <header className="rm-hero">
            <h1 className="rm-title">Roommate Finder</h1>
            <p className="rm-subtitle">Filter listings by area, budget, and preferences.</p>
          </header>

          <section className="rm-filters">
            <input
              className="rm-input"
              type="text"
              placeholder="Search by title or location"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <input
              className="rm-input"
              type="text"
              placeholder="Area (e.g., Dhanmondi)"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            <input
              className="rm-input"
              type="number"
              placeholder="Max rent (৳)"
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
            />
            <select
              className="rm-input"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Gender preference</option>
              <option value="Any">Any</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </section>

          <section className="rm-scroll">
            <div className="rm-grid">
              {filtered.map((l) => (
                <article key={l.id} className="rm-card">
                  <div className="rm-card-head">
                    <h3 className="rm-card-title">{l.title}</h3>
                    <span className="rm-badge">{l.sharing}</span>
                  </div>
                  <p className="rm-card-meta">
                    <span className="rm-loc">{l.location}</span>
                    <span className="rm-sep">•</span>
                    <span className="rm-rent">৳{l.rent}/mo</span>
                    <span className="rm-sep">•</span>
                    <span className="rm-gender">{l.genderPref}</span>
                  </p>
                  <div className="rm-amenities">
                    {l.amenities.map((a) => (
                      <span key={a} className="rm-chip">{a}</span>
                    ))}
                  </div>
                  <div className="rm-actions">
                    <button className="rm-btn rm-btn-primary">View details</button>
                    <button className="rm-btn rm-btn-ghost">Contact</button>
                  </div>
                </article>
              ))}
              {filtered.length === 0 && (
                <div className="rm-empty">No listings match your filters.</div>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}