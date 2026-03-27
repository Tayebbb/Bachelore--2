import {
  AppliedMaid,
  AppliedTuition,
  BookedMaid,
  BookedTuition,
  HouseRentListing,
  Maid,
  RoommateListing,
  Tuition,
} from '../db/models.js';
import { normalizeEmail } from '../utils/auth.js';

export const getUserActivity = async (req, res) => {
  const { userEmail } = req.params;
  if (!userEmail) return res.status(400).json({ error: 'userEmail required' });

  try {
    const normalizedEmail = normalizeEmail(userEmail);

    const [
      bookedMaids,
      bookedTuitions,
      appliedMaids,
      appliedTuitions,
      roommateListings,
      houseRentListings,
    ] = await Promise.all([
      BookedMaid.findAll({ where: { ApplicantEmail: normalizedEmail }, order: [['BookedAt', 'DESC']], limit: 5 }),
      BookedTuition.findAll({ where: { ApplicantEmail: normalizedEmail }, order: [['BookedAt', 'DESC']], limit: 5 }),
      AppliedMaid.findAll({
        where: { Email: normalizedEmail },
        include: [{ model: Maid }],
        order: [['CreatedAt', 'DESC']],
        limit: 5,
      }),
      AppliedTuition.findAll({
        where: { Email: normalizedEmail },
        include: [{ model: Tuition }],
        order: [['CreatedAt', 'DESC']],
        limit: 5,
      }),
      RoommateListing.findAll({ where: { Email: normalizedEmail }, order: [['CreatedAt', 'DESC']], limit: 5 }),
      HouseRentListing.findAll({ where: { Contact: normalizedEmail }, order: [['CreatedAt', 'DESC']], limit: 5 }),
    ]);

    res.json({
      bookedMaids: bookedMaids.map((b) => ({ ...b.toJSON(), status: 'booked' })),
      bookedTuitions: bookedTuitions.map((b) => ({ ...b.toJSON(), status: 'booked' })),
      appliedMaids: appliedMaids.map((app) => ({
        ...app.toJSON(),
        listingName: app.Maid ? app.Maid.Name : app.Name,
        hourlyRate: app.Maid ? app.Maid.HourlyRate : undefined,
        location: app.Maid ? app.Maid.Location : undefined,
        description: app.Maid ? app.Maid.Description : undefined,
        status: 'applied',
      })),
      appliedTuitions: appliedTuitions.map((app) => ({
        ...app.toJSON(),
        listingTitle: app.Tuition ? app.Tuition.Title : app.Name,
        subject: app.Tuition ? app.Tuition.Subject : undefined,
        days: app.Tuition ? app.Tuition.Days : undefined,
        salary: app.Tuition ? app.Tuition.Salary : undefined,
        location: app.Tuition ? app.Tuition.Location : undefined,
        description: app.Tuition ? app.Tuition.Description : undefined,
        contact: app.Tuition ? app.Tuition.Contact : undefined,
        status: 'applied',
      })),
      roommateListings,
      houseRentListings,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity', details: err.message });
  }
};
