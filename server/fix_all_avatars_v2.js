const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const fixAllAvatars = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update Sumit Kumar specifically
    // Provide a name if missing to satisfy validation
    const sumit = await User.findOne({ username: 'Sumit Kumar' });
    if (sumit) {
      console.log('Found Sumit:', sumit.username);
      await User.updateOne(
        { _id: sumit._id },
        { 
          $set: { 
            profilePic: '/avatars/avatar_1.png',
            name: sumit.name || 'Sumit Kumar' // Ensure name exists
          } 
        }
      );
      console.log('Updated Sumit profile.');
    }

    // Update any other user still using an uploaded file or the old default
    const result = await User.updateMany(
      { profilePic: { $regex: /uploads|icon-library|pravatar/ } },
      { $set: { profilePic: '/avatars/avatar_1.png' } }
    );
    console.log(`Updated ${result.modifiedCount} users with old profile pics.`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixAllAvatars();
