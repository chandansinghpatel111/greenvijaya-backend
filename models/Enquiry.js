const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional now
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['New', 'Contacted', 'Closed'], default: 'New' },
  message: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', EnquirySchema);
