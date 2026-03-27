const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const updateAvatars = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      { profilePic: /icon-library|pravatar/ }, 
      { $set: { profilePic: '/avatars/avatar_1.png' } }
    );

    console.log(`Updated ${result.modifiedCount} users.`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error updating avatars:', error);
    process.exit(1);
  }
};

updateAvatars();
