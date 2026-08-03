const mongoose = require('mongoose');
const dns = require('dns');

// Fix for local ISP blocking MongoDB Atlas SRV records (e.g. Jio in India)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/green_vijaya_mern';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

module.exports = connectDB;
