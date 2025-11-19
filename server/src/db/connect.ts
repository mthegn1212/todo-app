import mongoose from "mongoose";

const connectDB = async (url: string) => {
  try {
    // Dòng này giúp bỏ qua warning của Mongoose
    mongoose.set('strictQuery', false); 
    
    await mongoose.connect(url);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;