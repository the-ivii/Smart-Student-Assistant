import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Use a simple database name without special characters
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://aryansingh:aryanmongodb@cluster0.7shqalg.mongodb.net/smartstudy?retryWrites=true&w=majority';

export async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

export default mongoose;

