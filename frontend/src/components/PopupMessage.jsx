import React, { useEffect } from 'react';

export default function PopupMessage({ message, show, duration = 2000, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;
  return (
    <div className="popup-message">
      {message}
    </div>
  );
}
