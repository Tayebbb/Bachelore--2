import HouseRentListing from '../models/HouseRentListing.js';
import Contact from '../models/Contact.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const ADMIN_CODE = process.env.ADMIN_CODE || 'choton2025';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

async function isAdminFromReq(req){
  let isAdmin = false;
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try { const payload = jwt.verify(token, JWT_SECRET); if (payload && payload.role === 'admin') isAdmin = true; } catch (err) {}
  }
  const adminCode = req.body.adminCode || req.query.adminCode;
  if (!isAdmin && adminCode === ADMIN_CODE) isAdmin = true;
  return isAdmin;
}

export const createListing = async (req, res) => {
  try{
  // only admin may create listings
  const isAdmin = await isAdminFromReq(req);
  if(!isAdmin) return res.status(403).json({ msg: 'Forbidden' });
  const { ownerId, title, description, location, price, rooms, images, contact } = req.body;
  if(!title) return res.status(400).json({ msg: 'title required' });
  // ownerId is optional for admin-created listings; set ownerRef to null when missing or invalid
  const ownerRef = ownerId && mongoose.Types.ObjectId.isValid(ownerId) ? ownerId : null;
  // Listings created by admin should be visible immediately (auto-verified)
  const listing = new HouseRentListing({ ownerRef, title, description, location, price, rooms, images: images || [], contact, verified: true });
  await listing.save();
  res.status(201).json({ msg: 'Listing created', listing });
  }catch(err){ res.status(500).json({ error: err.message }); }
};

export const listListings = async (req, res) => {
  try{
    const { minPrice, maxPrice, location, rooms } = req.query;
    const q = { verified: true };
    if(minPrice) q.price = { ...q.price, $gte: Number(minPrice) };
    if(maxPrice) q.price = { ...q.price, $lte: Number(maxPrice) };
    if(location) q.location = { $regex: location, $options: 'i' };
    if(rooms) q.rooms = Number(rooms);
    const list = await HouseRentListing.find(q).sort({ createdAt: -1 });
    res.json(list);
  }catch(err){ res.status(500).json({ error: err.message }); }
};

export const adminListUnverified = async (req, res) => {
  try{
    const isAdmin = await isAdminFromReq(req);
    if(!isAdmin) return res.status(403).json({ msg: 'Forbidden' });
    const list = await HouseRentListing.find({ verified: false }).sort({ createdAt: -1 });
    res.json(list);
  }catch(err){ res.status(500).json({ error: err.message }); }
}

export const verifyListing = async (req, res) => {
  try{
    const isAdmin = await isAdminFromReq(req);
    if(!isAdmin) return res.status(403).json({ msg: 'Forbidden' });
    const id = req.params.id;
    const listing = await HouseRentListing.findById(id);
    if(!listing) return res.status(404).json({ msg: 'Listing not found' });
    listing.verified = true; await listing.save();
    res.json({ msg: 'Listing verified', listing });
  }catch(err){ res.status(500).json({ error: err.message }); }
}

export const deleteListing = async (req, res) => {
  try{
    const isAdmin = await isAdminFromReq(req);
    if(!isAdmin) return res.status(403).json({ msg: 'Forbidden' });
    const id = req.params.id;
    await HouseRentListing.findByIdAndDelete(id);
    res.json({ msg: 'Deleted' });
  }catch(err){ res.status(500).json({ error: err.message }); }
}

export const createContact = async (req, res) => {
  try{
    const { senderId, receiverId, message } = req.body;
    if(!senderId || !receiverId || !message) return res.status(400).json({ msg: 'senderId, receiverId and message required' });
    const contact = new Contact({ senderId, receiverId, message });
    await contact.save();
    res.status(201).json({ msg: 'Message sent', contact });
  }catch(err){ res.status(500).json({ error: err.message }); }
}

export const listContactsForUser = async (req, res) => {
  try{
    const userId = req.params.userId;
    const list = await Contact.find({ receiverId: userId }).sort({ createdAt: -1 });
    res.json(list);
  }catch(err){ res.status(500).json({ error: err.message }); }
}
