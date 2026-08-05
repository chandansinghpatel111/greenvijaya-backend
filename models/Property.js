const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  city: { type: String },
  state: { type: String },
  propertyType: { type: String },
  amenities: [{ type: String }],
  images: [{ type: String }], // Cloudinary/Local URLs
  projectBuildingName: { type: String },
  locality: { type: String },
  plotArea: { type: String },
  furnishing: { type: String },
  floorNumber: { type: String },
  totalFloors: { type: String },
  listingType: { type: String },
  propertyCategory: { type: String },
  facingType: { type: String },
  contactNumber: { type: String },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Sold'], default: 'Pending' },
  rejectionReason: { type: String },
  views: { type: Number, default: 0 },
  buyerDetails: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    notes: { type: String },
    soldDate: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Property', PropertySchema);
