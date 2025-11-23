import mongoose from 'mongoose';

const HouseRentListingSchema = new mongoose.Schema({

  ownerRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String },
  location: { type: String },
  price: { type: Number },
  rooms: { type: Number },
  images: [{ type: String }],
  contact: { type: String },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const HouseRentListing = mongoose.models.HouseRentListing || mongoose.model('HouseRentListing', HouseRentListingSchema);

export default HouseRentListing;
