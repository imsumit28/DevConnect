const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const fixAllAvatars = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update Sumit Kumar specifically by username
    const sumit = await User.findOne({ username: 'Sumit Kumar' });
    if (sumit) {
      console.log('Found Sumit:', sumit.username);
      sumit.profilePic = '/avatars/avatar_1.png';
      await sumit.save();
    }

    // Update any other user still using an uploaded file (likely old LinkedIn logos)
    const result = await User.updateMany(
      { profilePic: /uploads/ },
      { $set: { profilePic: '/avatars/avatar_1.png' } }
    );
    console.log(`Updated ${result.modifiedCount} users with uploaded profile pics.`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixAllAvatars();
