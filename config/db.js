const mongoose = require('mongoose');
const dns = require('dns');

// Fix for local ISP blocking MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'https://greenvijaya-backend-psi.vercel.app/';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

module.exports = connectDB;
