
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUser } from '../lib/auth';
import ActivityDetailsModal from './ActivityDetailsModal';

function timeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)} hr ago`;
  if (diff < 2592000) return `${Math.floor(diff/86400)} days ago`;
  return date.toLocaleDateString();
}


export default function ActivityFeed() {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalItem, setModalItem] = useState(null);

  useEffect(() => {
    const user = getUser();
    if (!user || !user.email) {
      setError('Not logged in');
      setLoading(false);
      return;
    }
    fetch(`/api/activity/${encodeURIComponent(user.email)}`)
      .then(res => res.json())
      .then(data => {
        setActivity(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load activity');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading activity...</div>;
  if (error) return <div className="text-danger">{error}</div>;
  if (!activity) return null;

  const { bookedMaids = [], bookedTuitions = [], appliedMaids = [], appliedTuitions = [], roommateListings = [], houseRentListings = [] } = activity;

  // Add all available fields for modal details
  const items = [
    ...bookedMaids.map(a => ({
      type: 'Maid',
      status: a.status || 'booked',
      title: a.name,
      date: a.bookedAt,
      link: '/maids',
      desc: a.hourlyRate ? `Rate: ${a.hourlyRate}` : '',
      details: {
        'Location': a.location,
        'Contact': a.contact,
        'Applicant Name': a.applicantName,
        'Applicant Contact': a.applicantContact,
        'Message': a.message,
        'Busy Until': a.busyUntil ? new Date(a.busyUntil).toLocaleString() : undefined,
      },
    })),
    ...bookedTuitions.map(a => ({
      type: 'Tuition',
      status: a.status || 'booked',
      title: a.title,
      date: a.bookedAt,
      link: '/tuitions',
      desc: a.subject ? `Subject: ${a.subject}` : '',
      details: {
        'Subject': a.subject,
        'Days': a.days,
        'Salary': a.salary,
        'Location': a.location,
        'Description': a.description,
        'Contact': a.contact,
        'Applicant Name': a.applicantName,
        'Applicant Contact': a.applicantContact,
        'Message': a.message,
      },
    })),
    ...appliedMaids.map(a => ({
      type: 'Maid',
      status: a.status || 'applied',
      title: a.listingName || a.name,
      date: a.createdAt,
      link: '/maids',
      desc: a.hourlyRate ? `Rate: ${a.hourlyRate}` : '',
      details: {
        'Location': a.location,
        'Contact': a.contact,
        'Description': a.description,
        'Message': a.message,
      },
    })),
    ...appliedTuitions.map(a => ({
      type: 'Tuition',
      status: a.status || 'applied',
      title: a.listingTitle || a.title || a.subject || 'Tuition',
      date: a.createdAt,
      link: '/tuitions',
      desc: a.subject ? `Subject: ${a.subject}` : '',
      details: {
        'Subject': a.subject,
        'Days': a.days,
        'Salary': a.salary,
        'Location': a.location,
        'Description': a.description,
        'Contact': 'Will be available if confirmed',
        'Message': a.message,
      },
    })),
    ...roommateListings.map(a => ({
      type: 'Roommate Listing',
      status: 'posted',
      title: a.name,
      date: a.createdAt,
      link: '/roommates',
      desc: a.location ? `Location: ${a.location}` : '',
      details: {
        'Email': a.email,
        'Contact': a.contact,
        'Location': a.location,
        'Rooms Available': a.roomsAvailable,
        'Details': a.details,
      },
    })),
    ...houseRentListings.map(a => ({
      type: 'House Rent Listing',
      status: 'posted',
      title: a.title,
      date: a.createdAt,
      link: '/house-rent',
      desc: a.location ? `Location: ${a.location}` : '',
      details: {
        'Location': a.location,
        'Price': a.price,
        'Rooms': a.rooms,
        'Contact': a.contact,
        'Description': a.description,
      },
    })),
  ];

  // Sort by date descending, show top 5
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  const topItems = items.slice(0, 5);

  return (
    <div className="activity-feed-ui">
      <ul className="list-group activity-list shadow-sm rounded-3">
        {topItems.length === 0 && <li className="list-group-item">No recent activity found.</li>}
        {topItems.map((item, i) => (
          <li className={`list-group-item d-flex justify-content-between align-items-center activity-card activity-card--${item.status}`} key={i} style={{borderLeft: `5px solid ${item.status==='booked'?'#28a745':item.status==='applied'?'#ffc107':'#007bff'}`}}>
            <div>
              <div className="fw-bold d-flex align-items-center gap-2">
                <span className={`badge bg-${item.status==='booked'?'success':item.status==='applied'?'warning text-dark':'primary'}`}>{item.status}</span>
                <span>{item.type}: {item.title}</span>
              </div>
              <div className="muted small">{item.desc} {timeAgo(item.date)}</div>
            </div>
            <button className="btn btn-sm btn-outline-primary px-3" onClick={() => setModalItem(item)} style={{fontWeight:600}}>View</button>
          </li>
        ))}
      </ul>
      <ActivityDetailsModal show={!!modalItem} item={modalItem} onClose={() => setModalItem(null)} />
    </div>
  );
}
