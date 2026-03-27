import { Op } from 'sequelize';
import { Contact, HouseRentImage, HouseRentListing, User } from '../db/models.js';
import { isAdminFromReq } from '../utils/auth.js';

function serializeListing(listing) {
  return {
    _id: listing.HouseRentListingId,
    ownerRef: listing.OwnerUserId,
    title: listing.Title,
    description: listing.Description,
    location: listing.Location,
    price: listing.Price ? Number(listing.Price) : null,
    rooms: listing.Rooms,
    images: (listing.HouseRentImages || []).map((img) => img.ImageUrl),
    contact: listing.Contact,
    verified: listing.Verified,
    createdAt: listing.CreatedAt,
  };
}

export const createListing = async (req, res) => {
  try {
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const { ownerId, title, description, location, price, rooms, images, contact } = req.body;
    if (!title) return res.status(400).json({ msg: 'title required' });

    const owner = ownerId ? await User.findByPk(ownerId) : null;

    const listing = await HouseRentListing.create({
      OwnerUserId: owner ? owner.UserId : null,
      Title: title,
      Description: description || '',
      Location: location || '',
      Price: price ? Number(price) : null,
      Rooms: rooms ? Number(rooms) : null,
      Contact: contact || '',
      Verified: true,
    });

    if (Array.isArray(images) && images.length > 0) {
      await HouseRentImage.bulkCreate(
        images
          .filter(Boolean)
          .map((imageUrl, index) => ({
            HouseRentListingId: listing.HouseRentListingId,
            ImageUrl: imageUrl,
            SortOrder: index,
          })),
      );
    }

    const withImages = await HouseRentListing.findByPk(listing.HouseRentListingId, {
      include: [{ model: HouseRentImage }],
    });

    res.status(201).json({ msg: 'Listing created', listing: serializeListing(withImages) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listListings = async (req, res) => {
  try {
    const { minPrice, maxPrice, location, rooms } = req.query;
    const where = { Verified: true };

    if (minPrice || maxPrice) {
      where.Price = {};
      if (minPrice) where.Price[Op.gte] = Number(minPrice);
      if (maxPrice) where.Price[Op.lte] = Number(maxPrice);
    }

    if (location) {
      where.Location = { [Op.like]: `%${location}%` };
    }

    if (rooms) {
      where.Rooms = Number(rooms);
    }

    const list = await HouseRentListing.findAll({
      where,
      include: [{ model: HouseRentImage }],
      order: [['CreatedAt', 'DESC']],
    });

    res.json(list.map(serializeListing));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const adminListUnverified = async (req, res) => {
  try {
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const list = await HouseRentListing.findAll({
      where: { Verified: false },
      include: [{ model: HouseRentImage }],
      order: [['CreatedAt', 'DESC']],
    });

    res.json(list.map(serializeListing));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyListing = async (req, res) => {
  try {
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const id = req.params.id;
    const listing = await HouseRentListing.findByPk(id);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });

    listing.Verified = true;
    await listing.save();

    const withImages = await HouseRentListing.findByPk(id, { include: [{ model: HouseRentImage }] });
    res.json({ msg: 'Listing verified', listing: serializeListing(withImages) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteListing = async (req, res) => {
  try {
    if (!isAdminFromReq(req)) return res.status(403).json({ msg: 'Forbidden' });

    const id = req.params.id;
    await HouseRentListing.destroy({ where: { HouseRentListingId: id } });
    res.json({ msg: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createContact = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ msg: 'senderId, receiverId and message required' });
    }

    const [sender, receiver] = await Promise.all([User.findByPk(senderId), User.findByPk(receiverId)]);
    if (!sender || !receiver) {
      return res.status(404).json({ msg: 'Invalid sender or receiver' });
    }

    const contact = await Contact.create({
      SenderUserId: senderId,
      ReceiverUserId: receiverId,
      Message: message,
    });

    res.status(201).json({ msg: 'Message sent', contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listContactsForUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const list = await Contact.findAll({
      where: { ReceiverUserId: userId },
      include: [
        { model: User, as: 'Sender', attributes: ['UserId', 'FullName', 'Email'] },
        { model: User, as: 'Receiver', attributes: ['UserId', 'FullName', 'Email'] },
      ],
      order: [['CreatedAt', 'DESC']],
    });

    res.json(
      list.map((item) => ({
        _id: item.ContactId,
        senderId: item.SenderUserId,
        receiverId: item.ReceiverUserId,
        message: item.Message,
        status: item.Status,
        createdAt: item.CreatedAt,
        sender: item.Sender,
        receiver: item.Receiver,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
