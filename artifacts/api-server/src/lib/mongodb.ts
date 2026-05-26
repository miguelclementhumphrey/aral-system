import mongoose from "mongoose";
import { logger } from "./logger";
import { requiredEnv } from "./env";

export async function connectMongoDB(): Promise<void> {
  try {
    const mongodbUri = requiredEnv("MONGODB_URI");
    await mongoose.connect(mongodbUri);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error({ error }, "Failed to connect to MongoDB");
    throw error;
  }
}
