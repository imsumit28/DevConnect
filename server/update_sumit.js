const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const findAndUpdateSumit = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const sumit = await User.findOne({ name: /Sumit/i });
    if (sumit) {
      console.log('Found Sumit:', sumit.name, sumit.profilePic);
      sumit.profilePic = '/avatars/avatar_1.png';
      await sumit.save();
      console.log('Updated Sumit avatar.');
    } else {
      console.log('Sumit not found.');
      // Fallback: Update ALL users that still have external URLs
      const result = await User.updateMany(
        { profilePic: /^http/ },
        { $set: { profilePic: '/avatars/avatar_1.png' } }
      );
      console.log(`Updated ${result.modifiedCount} other users with HTTP profile pics.`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

findAndUpdateSumit();
