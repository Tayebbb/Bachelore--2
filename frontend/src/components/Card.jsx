import React from "react";

const Card = ({ title, description, button }) => (
  <div className="card">
    <h4 className="card-title">{title}</h4>
    <p className="card-description">{description}</p>
    <div className="card-button-container">
      {button && (
        <a href={button.link} className="card-button">
          {button.text}
        </a>
      )}
    </div>
  </div>
);

export default Card;
