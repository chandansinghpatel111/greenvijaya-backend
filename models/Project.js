const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  projectBuildingName: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  locality: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  plotArea: {
    type: String,
  },
  price: {
    type: Number,
  },
  amenities: [{
    type: String,
  }],
  images: [{
    type: String,
    required: true
  }],
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Upcoming'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema);
