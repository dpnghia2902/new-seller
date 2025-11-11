require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Replace 'seller1' with your seller username
    const username = process.argv[2] || 'seller1';
    const user = await User.findOne({ username });

    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log('\n=== User Verification Status ===');
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Has Shop (storeId):', !!user.storeId);
    console.log('isVerified:', user.isVerified);
    console.log('verificationStatus:', user.verificationStatus);
    console.log('verifiedAt:', user.verifiedAt);
    console.log('verificationSubmittedAt:', user.verificationSubmittedAt);
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkUser();
