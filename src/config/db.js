import mongoose from 'mongoose';
import colors from 'colors';
import dotenv from "dotenv";

dotenv.config(); 

const connectDB = async () => {
  try {
    console.log("My uri",process.env.MONGO_URI);
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.bold);
    process.exit(1);
  }
};

export default connectDB;