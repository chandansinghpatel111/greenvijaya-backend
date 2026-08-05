const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const User = require('./models/User');
const Property = require('./models/Property');
const Enquiry = require('./models/Enquiry');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/green_vijaya_mern').then(async () => {
  try {
    // Find all broker users
    // Since I already removed 'broker' from enum, they might still be in DB with role 'broker'
    // I can just find properties populated with broker and if broker role is 'broker', delete.
    const properties = await Property.find().populate('broker');
    let deleteCount = 0;
    
    for (const p of properties) {
      if (p.broker && p.broker.role === 'broker') {
        await Property.findByIdAndDelete(p._id);
        deleteCount++;
      }
    }
    console.log('Deleted broker properties:', deleteCount);

    // Rename 'broker' to 'postedBy' in Property collection
    const propRenameRes = await mongoose.connection.db.collection('properties').updateMany(
      { broker: { $exists: true } },
      { $rename: { 'broker': 'postedBy' } }
    );
    console.log('Renamed broker to postedBy in properties:', propRenameRes.modifiedCount);

    // Rename 'broker' to 'postedBy' in Enquiry collection
    const enqRenameRes = await mongoose.connection.db.collection('enquiries').updateMany(
      { broker: { $exists: true } },
      { $rename: { 'broker': 'postedBy' } }
    );
    console.log('Renamed broker to postedBy in enquiries:', enqRenameRes.modifiedCount);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
});
