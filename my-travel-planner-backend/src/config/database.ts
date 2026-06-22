import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("FATAL ERROR: MONGODB_URI environment variable is not defined.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Connection Error Detail: ", error);
    process.exit(1);
  }
}
