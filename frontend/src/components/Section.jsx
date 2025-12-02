import React from "react";

const Section = ({ id, className, title, tagline, description, children }) => (
  <section id={id} className={`section ${className || ""}`}>
    <h2 className="section-title">{title}</h2>
    {tagline && <h3 className="section-tagline">{tagline}</h3>}
    {description && <p className="section-description">{description}</p>}
    {children}
  </section>
);

export default Section;
