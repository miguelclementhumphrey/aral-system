import mongoose from "mongoose";
import { logger } from "./logger";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/aral_system";

export async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error({ error }, "Failed to connect to MongoDB");
    throw error;
  }
}
