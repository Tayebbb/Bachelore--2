import express from 'express';
import { toggleAvailability, listAppliedRoommates, verifyAppliedRoommate, listRoommateListings, applyAsHost, getMyListing, updateMyListing, deleteMyListing, applyToHost, listAppliedToHost, verifyAppliedToHost, listBookedRoommates, unbookRoommate } from '../controllers/roommateController.js';

const router = express.Router();

import { RoommateListing } from '../db/models.js'; // New: import RoommateListing
// toggle availability for a user (userId in path)
// legacy toggle kept for backward compatibility (optional)
router.post('/:userId/toggle', toggleAvailability);

// apply as host: create or update your visible listing
router.post('/:userId/apply', applyAsHost);
router.get('/:userId/listing', getMyListing);
router.put('/:userId/listing', updateMyListing);
router.delete('/:userId/listing', deleteMyListing);

// apply to a host listing (seekers)
router.post('/:listingId/apply', applyToHost);
// create a raw application entry (used by UI 'Apply' button)
router.post('/applied', async (req, res) => {
	try{ await import('../controllers/roommateController.js').then(m => m.createAppliedRoommate(req, res)); }
	catch(err){ res.status(500).json({ error: String(err) }); }
});

// admin: list applied roommates
router.get('/applied', listAppliedRoommates);
// admin: list applications made to host listings (shows applicant + host/listing)
router.get('/applied-to-host', listAppliedToHost);
// admin: verify an application to a host listing (creates booked roommate entry)
router.post('/applied-to-host/:id/verify', async (req, res) => {
	try{ await import('../controllers/roommateController.js').then(m => m.verifyAppliedToHost(req, res)); }
	catch(err){ res.status(500).json({ error: String(err) }); }
});
// admin: verify application
router.post('/applied/:id/verify', verifyAppliedRoommate);
// admin: delete application
router.delete('/applied/:id', async (req, res) => {
	try{ const id = req.params.id; await import('../controllers/roommateController.js').then(m=>m.deleteAppliedRoommate(req, res)); }
	catch(err){ res.status(500).json({ error: String(err) }); }
});

// admin: create roommate listing directly (admin can post on behalf of a user)
router.post('/admin/create', async (req, res) => {
	try{ await import('../controllers/roommateController.js').then(m => m.adminCreateListing(req, res)); }
	catch(err){ res.status(500).json({ error: String(err) }); }
});

// admin: list booked roommates
router.get('/booked', async (req, res) => {
	try{ await import('../controllers/roommateController.js').then(m => m.listBookedRoommates(req, res)); }
	catch(err){ res.status(500).json({ error: String(err) }); }
});

// admin: unbook a booked roommate entry
router.post('/booked/:id/unbook', async (req, res) => {
	try{ await import('../controllers/roommateController.js').then(m => m.unbookRoommate(req, res)); }
	catch(err){ res.status(500).json({ error: String(err) }); }
});

// public: list roommate listings (seekers only) - requires userId query to check role
router.get('/listings', listRoommateListings);
// New: get listing by listingId
router.get('/listing/:listingId', async (req, res) => {
  try {
    const listing = await RoommateListing.findByPk(req.params.listingId);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;