import React, { useState } from 'react';
import api from '../components/axios.jsx';
import PopupMessage from '../components/PopupMessage.jsx';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../lib/auth';

export default function SubscriptionPage() {
  const [bkashNumber, setBkashNumber] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();
  const isValidBkashNumber = (value) => /^01\d{9}$/.test(String(value || '').trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bkashNumber.trim() || !reference.trim()) {
      setPopup({ show: true, message: 'Please fill in all fields', type: 'error' });
      return;
    }
    if (!isValidBkashNumber(bkashNumber)) {
      setPopup({ show: true, message: 'BKash number must be 11 digits and start with 01.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const currentUser = getUser();
      const userId = currentUser?.id || currentUser?._id || currentUser?.user_id;
      await api.post('/api/student/subscription/pay', {
        userId,
        name: currentUser?.name || currentUser?.fullName || '',
        email: currentUser?.email || '',
        role: currentUser?.role || 'student',
        bkashNumber,
        reference,
        amount: 99,
        paymentMethod: 'bkash'
      });
      setPopup({ show: true, message: 'Payment Verified! Your subscription is now active.', type: 'success' });
      setTimeout(() => {
        setBkashNumber('');
        setReference('');
        navigate('/student/dashboard');
      }, 2000);
    } catch (error) {
      setPopup({ 
        show: true, 
        message: error.response?.data?.msg || 'Payment failed. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f7f7f7',
      padding: '32px 0'
    }}>
      <PopupMessage 
        message={popup.message} 
        show={popup.show} 
        duration={3000}
        onClose={() => setPopup({ ...popup, show: false })} 
      />
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '1.5em', fontWeight: 600 }}>Subscribe Now</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>
              BKash Number
            </label>
            <input
              type="text"
              value={bkashNumber}
              onChange={(e) => setBkashNumber(e.target.value)}
              placeholder="Enter your BKash number"
              inputMode="numeric"
              maxLength={11}
              pattern="01[0-9]{9}"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1em',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
            />
            <div style={{ marginTop: '6px', fontSize: '0.85em', color: '#666' }}>
              Must be 11 digits and start with 01.
            </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#333' }}>
              Transaction Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Enter transaction reference"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1em',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#e2136e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '1.1em',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : 'Pay & Subscribe'}
          </button>
        </form>
      </div>
    </div>
  );
}
