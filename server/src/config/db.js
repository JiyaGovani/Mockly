import mongoose from 'mongoose';

const dbConnect = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mockly';
    await mongoose.connect(uri, {
      // useNewUrlParser and useUnifiedTopology are default in mongoose 8+
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

export default dbConnect;
