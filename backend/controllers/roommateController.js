import {
  AppliedRoommate,
  AppliedToHost,
  BookedRoommate,
  RoommateListing,
  User,
  db,
} from '../db/models.js';
import { isAdminFromReq, normalizeEmail } from '../utils/auth.js';

function toListingPayload(listing) {
  return {
    _id: listing.RoommateListingId,
    userRef: listing.UserId,
    name: listing.Name,
    email: listing.Email,
    contact: listing.Contact,
    location: listing.Location,
    roomsAvailable: listing.RoomsAvailable,
    details: listing.Details,
    createdAt: listing.CreatedAt,
  };
}

export const toggleAvailability = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { isAvailable, location, roomsAvailable, details } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.IsAvailableAsHost = !!isAvailable;

    if (isAvailable) {
      user.RoommateCategory = 'HostRoommate';
      await user.save();

      const applied = await AppliedRoommate.create({
        UserId: user.UserId,
        Name: user.FullName || '',
        Email: user.Email || '',
        Contact: user.Phone || '',
        Location: location || '',
        RoomsAvailable: roomsAvailable || '',
        Message: details || '',
      });

      return res.json({ msg: 'Marked available. Application submitted', applied });
    }

    await user.save();
    await RoommateListing.destroy({ where: { UserId: user.UserId } });
    return res.json({ msg: 'Availability removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listAppliedRoommates = async (req, res) => {
  try {
    const list = await AppliedRoommate.findAll({
      include: [{ model: User }],
      order: [['CreatedAt', 'DESC']],
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createAppliedRoommate = async (req, res) => {
  try {
    const { listingId, applicantId, name, email, contact, message } = req.body;

    let userRef = null;
    if (applicantId) {
      const user = await User.findByPk(applicantId);
      if (user) userRef = user.UserId;
    }

    let listingInfo = {};
    if (listingId) {
      const listing = await RoommateListing.findByPk(listingId);
      if (listing) {
        listingInfo = {
          location: listing.Location || '',
          name: listing.Name || '',
          roomsAvailable: listing.RoomsAvailable || '',
        };
      }
    }

    const app = await AppliedRoommate.create({
      UserId: userRef,
      Name: name || listingInfo.name || '',
      Email: normalizeEmail(email || ''),
      Contact: contact || '',
      Location: listingInfo.location || '',
      RoomsAvailable: listingInfo.roomsAvailable || '',
      Message: message || '',
    });

    res.status(201).json({ msg: 'Application submitted', application: app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyAppliedRoommate = async (req, res) => {
  try {
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const id = req.params.id;
    const transaction = await db.sequelize.transaction();
    try {
      const app = await AppliedRoommate.findByPk(id, { transaction });
      if (!app) {
        await transaction.rollback();
        return res.status(404).json({ msg: 'Application not found' });
      }

      let user = null;
      if (app.UserId) {
        user = await User.findByPk(app.UserId, { transaction });
      }

      const listing = await RoommateListing.create(
        {
          UserId: user ? user.UserId : null,
          Name: app.Name || (user ? user.FullName : '') || '',
          Email: app.Email || (user ? user.Email : '') || '',
          Contact: app.Contact || (user ? user.Phone : '') || '',
          Location: app.Location || '',
          RoomsAvailable: app.RoomsAvailable || '',
          Details: app.Message || '',
        },
        { transaction },
      );

      if (user) {
        user.RoommateCategory = 'HostRoommate';
        user.IsAvailableAsHost = true;
        await user.save({ transaction });
      }

      const booked = await BookedRoommate.create(
        {
          AppliedRoommateId: app.AppliedRoommateId,
          RoommateListingId: listing.RoommateListingId,
          HostUserId: user ? user.UserId : null,
          HostName: listing.Name,
          HostEmail: listing.Email,
          HostContact: listing.Contact,
          Location: listing.Location,
          RoomsAvailable: listing.RoomsAvailable,
          Details: listing.Details,
          ApplicantUserId: app.UserId || null,
          ApplicantName: app.Name || '',
          ApplicantEmail: app.Email || '',
          ApplicantContact: app.Contact || '',
          Message: app.Message || '',
        },
        { transaction },
      );

      app.Status = 'Booked';
      await app.save({ transaction });

      await transaction.commit();
      res.json({ msg: 'Verified, listed and booked', listing, booked });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAppliedRoommate = async (req, res) => {
  try {
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });
    const id = req.params.id;
    await AppliedRoommate.destroy({ where: { AppliedRoommateId: id } });
    res.json({ msg: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listRoommateListings = async (req, res) => {
  try {
    const list = await RoommateListing.findAll({ where: { IsActive: true }, order: [['CreatedAt', 'DESC']] });
    res.json(list.map(toListingPayload));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const adminCreateListing = async (req, res) => {
  try {
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const { ownerId, name, email, contact, location, roomsAvailable, details } = req.body;
    let user = null;

    if (ownerId) {
      if (ownerId.includes('@')) {
        user = await User.findOne({ where: { Email: normalizeEmail(ownerId) } });
      } else {
        user = await User.findByPk(ownerId);
      }
    }

    const listing = await RoommateListing.create({
      UserId: user ? user.UserId : null,
      Name: name || (user ? user.FullName : '') || '',
      Email: normalizeEmail(email || (user ? user.Email : '') || ''),
      Contact: contact || (user ? user.Phone : '') || '',
      Location: location || '',
      RoomsAvailable: roomsAvailable || '',
      Details: details || '',
    });

    if (user) {
      user.RoommateCategory = 'HostRoommate';
      user.IsAvailableAsHost = true;
      await user.save();
    }

    res.status(201).json({ msg: 'Listing created', listing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const applyAsHost = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, email, contact, location, roomsAvailable, details } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let listing = await RoommateListing.findOne({ where: { UserId: user.UserId } });
    if (listing) {
      listing.Name = name || listing.Name || user.FullName || '';
      listing.Email = normalizeEmail(email || listing.Email || user.Email || '');
      listing.Contact = contact || listing.Contact || user.Phone || '';
      listing.Location = location || listing.Location || '';
      listing.RoomsAvailable = roomsAvailable || listing.RoomsAvailable || '';
      listing.Details = details || listing.Details || '';
      await listing.save();
    } else {
      listing = await RoommateListing.create({
        UserId: user.UserId,
        Name: name || user.FullName || '',
        Email: normalizeEmail(email || user.Email || ''),
        Contact: contact || user.Phone || '',
        Location: location || '',
        RoomsAvailable: roomsAvailable || '',
        Details: details || '',
      });
    }

    user.RoommateCategory = 'HostRoommate';
    user.IsAvailableAsHost = true;
    await user.save();

    res.status(201).json({ msg: 'Listed as host', listing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyListing = async (req, res) => {
  try {
    const userId = req.params.userId;
    const listing = await RoommateListing.findOne({ where: { UserId: userId } });
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });
    res.json(toListingPayload(listing));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateMyListing = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, email, contact, location, roomsAvailable, details } = req.body;

    const listing = await RoommateListing.findOne({ where: { UserId: userId } });
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });

    listing.Name = name || listing.Name;
    listing.Email = normalizeEmail(email || listing.Email || '');
    listing.Contact = contact || listing.Contact;
    listing.Location = location || listing.Location;
    listing.RoomsAvailable = roomsAvailable || listing.RoomsAvailable;
    listing.Details = details || listing.Details;
    await listing.save();

    res.json({ msg: 'Updated', listing: toListingPayload(listing) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteMyListing = async (req, res) => {
  try {
    const userId = req.params.userId;
    await RoommateListing.destroy({ where: { UserId: userId } });

    const user = await User.findByPk(userId);
    if (user) {
      user.IsAvailableAsHost = false;
      if (user.RoommateCategory === 'HostRoommate') {
        user.RoommateCategory = 'SeekerRoommate';
      }
      await user.save();
    }

    res.json({ msg: 'Removed listing' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const applyToHost = async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const { applicantId, name, email, message } = req.body;
    const listing = await RoommateListing.findByPk(listingId);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });

    let applicantUser = null;
    if (applicantId) {
      applicantUser = await User.findByPk(applicantId);
    }

    const app = await AppliedToHost.create({
      RoommateListingId: listing.RoommateListingId,
      ApplicantUserId: applicantUser ? applicantUser.UserId : null,
      Name: name || (applicantUser ? applicantUser.FullName : '') || '',
      Email: normalizeEmail(email || (applicantUser ? applicantUser.Email : '') || ''),
      Message: message || '',
    });

    const populated = await AppliedToHost.findByPk(app.AppliedToHostId, {
      include: [{ model: User }, { model: RoommateListing, include: [{ model: User }] }],
    });

    res.status(201).json({ msg: 'Application submitted', application: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listAppliedToHost = async (req, res) => {
  try {
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const list = await AppliedToHost.findAll({
      include: [{ model: User }, { model: RoommateListing, include: [{ model: User }] }],
      order: [['CreatedAt', 'DESC']],
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyAppliedToHost = async (req, res) => {
  try {
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const id = req.params.id;
    const transaction = await db.sequelize.transaction();
    try {
      const app = await AppliedToHost.findByPk(id, {
        include: [{ model: RoommateListing, include: [{ model: User }] }, { model: User }],
        transaction,
      });
      if (!app) {
        await transaction.rollback();
        return res.status(404).json({ msg: 'Application not found' });
      }

      const listing = app.RoommateListing;
      if (!listing) {
        await transaction.rollback();
        return res.status(404).json({ msg: 'Listing not found' });
      }

      const booked = await BookedRoommate.create(
        {
          AppliedToHostId: app.AppliedToHostId,
          RoommateListingId: listing.RoommateListingId,
          HostUserId: listing.UserId || null,
          HostName: listing.Name || (listing.User ? listing.User.FullName : '') || '',
          HostEmail: listing.Email || (listing.User ? listing.User.Email : '') || '',
          HostContact: listing.Contact || '',
          Location: listing.Location || '',
          RoomsAvailable: listing.RoomsAvailable || '',
          Details: listing.Details || '',
          ApplicantUserId: app.ApplicantUserId || null,
          ApplicantName: app.Name || (app.User ? app.User.FullName : '') || '',
          ApplicantEmail: app.Email || (app.User ? app.User.Email : '') || '',
          ApplicantContact: app.User ? app.User.Phone || '' : '',
          Message: app.Message || '',
        },
        { transaction },
      );

      app.Status = 'Booked';
      await app.save({ transaction });

      await transaction.commit();
      res.json({ msg: 'Application verified and roommate booked', booked });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listBookedRoommates = async (req, res) => {
  try {
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const list = await BookedRoommate.findAll({
      include: [{ model: RoommateListing }, { model: AppliedToHost }, { model: AppliedRoommate }],
      order: [['BookedAt', 'DESC']],
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const unbookRoommate = async (req, res) => {
  try {
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const id = req.params.id;
    const booked = await BookedRoommate.findByPk(id);
    if (!booked) return res.status(404).json({ msg: 'Booked record not found' });

    if (booked.AppliedToHostId) {
      const app = await AppliedToHost.findByPk(booked.AppliedToHostId);
      if (app) {
        app.Status = 'Pending';
        await app.save();
      }
    }

    if (booked.AppliedRoommateId) {
      const app = await AppliedRoommate.findByPk(booked.AppliedRoommateId);
      if (app) {
        app.Status = 'Pending';
        await app.save();
      }
    }

    await booked.destroy();
    res.json({ msg: 'Unbooked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
