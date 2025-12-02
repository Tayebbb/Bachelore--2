import React, { useEffect, useState } from 'react';
import { getUser } from '../lib/auth';

export default function MarketplaceForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [contact, setContact] = useState('');
  const [image, setImage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const user = getUser();
    if (user) setContact(user.phone || user.contact || '');
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('');
    const user = getUser();
    if (!user || !user.email) { setStatus('Login required'); return; }
    if (!title || !description || !price || !contact) { setStatus('All fields required'); return; }
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, price, contact, image, sellerEmail: user.email })
      });
      if (!res.ok) throw new Error('Failed');
      setTitle(''); setDescription(''); setPrice(''); setImage('');
      setStatus('Listing posted!');
      if (onCreated) onCreated();
    } catch {
      setStatus('Failed to post');
    }
  };

  return (
    <form className="card p-3 mb-4" onSubmit={submit} style={{maxWidth:500}}>
      <h5 className="mb-3">Post an item</h5>
      <input className="form-control mb-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea className="form-control mb-2" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
      <input className="form-control mb-2" placeholder="Price" type="number" value={price} onChange={e=>setPrice(e.target.value)} />
      <input className="form-control mb-2" placeholder="Contact" value={contact} onChange={e=>setContact(e.target.value)} />
      <input className="form-control mb-2" placeholder="Image URL (optional)" value={image} onChange={e=>setImage(e.target.value)} />
      <button className="btn btn-primary" type="submit">Post</button>
      {status && <div className="mt-2 small text-muted">{status}</div>}
    </form>
  );
}
