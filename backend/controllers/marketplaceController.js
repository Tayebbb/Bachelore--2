import { MarketplaceListing } from '../db/models.js';

// Get all listings (optionally filter by status)
export const getListings = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { Status: status } : {};
    const listings = await MarketplaceListing.findAll({ where, order: [['CreatedAt', 'DESC']] });

    res.json(
      listings.map((listing) => ({
        _id: listing.MarketplaceListingId,
        title: listing.Title,
        description: listing.Description,
        price: Number(listing.Price),
        image: listing.Image,
        contact: listing.Contact,
        sellerEmail: listing.SellerEmail,
        buyerEmail: listing.BuyerEmail,
        status: listing.Status,
        createdAt: listing.CreatedAt,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Post a new listing
export const createListing = async (req, res) => {
  try {
    const { title, description, price, image, contact, sellerEmail } = req.body;
    if (!title || !description || !price || !contact || !sellerEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const listing = await MarketplaceListing.create({
      Title: title,
      Description: description,
      Price: Number(price),
      Image: image || null,
      Contact: contact,
      SellerEmail: sellerEmail,
    });

    res.status(201).json({
      _id: listing.MarketplaceListingId,
      title: listing.Title,
      description: listing.Description,
      price: Number(listing.Price),
      image: listing.Image,
      contact: listing.Contact,
      sellerEmail: listing.SellerEmail,
      buyerEmail: listing.BuyerEmail,
      status: listing.Status,
      createdAt: listing.CreatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark as sold (buy)
export const buyListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { buyerEmail } = req.body;
    if (!buyerEmail) return res.status(400).json({ error: 'buyerEmail required' });
    const listing = await MarketplaceListing.findByPk(id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.Status === 'sold') return res.status(400).json({ error: 'Already sold' });
    listing.Status = 'sold';
    listing.BuyerEmail = buyerEmail;
    await listing.save();
    res.json({
      _id: listing.MarketplaceListingId,
      title: listing.Title,
      description: listing.Description,
      price: Number(listing.Price),
      image: listing.Image,
      contact: listing.Contact,
      sellerEmail: listing.SellerEmail,
      buyerEmail: listing.BuyerEmail,
      status: listing.Status,
      createdAt: listing.CreatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
