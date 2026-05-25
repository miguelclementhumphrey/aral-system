import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface ISchool extends Document {
  name: string;
  schoolCode: string;
  division: string;
  district: string;
  region: string;
  schoolHeadName: string;
  schoolHeadContact: string;
  status: "pending" | "active" | "suspended";
  passwordHash?: string;
  isFirstLogin: boolean;
  failedAttempts: number;
  lockedUntil?: Date;
  lastLoginAt?: Date;
  profileComplete: boolean;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const SchoolSchema = new Schema<ISchool>({
  name: { type: String, required: true },
  schoolCode: { type: String, required: true, unique: true },
  division: { type: String, required: true },
  district: { type: String, required: true },
  region: { type: String, required: true },
  schoolHeadName: { type: String, required: true },
  schoolHeadContact: { type: String, required: true },
  status: { type: String, enum: ["pending", "active", "suspended"], default: "pending" },
  passwordHash: { type: String },
  isFirstLogin: { type: Boolean, default: true },
  failedAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date },
  lastLoginAt: { type: Date },
  profileComplete: { type: Boolean, default: false },
}, { timestamps: true });

SchoolSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

export const School = mongoose.model<ISchool>("School", SchoolSchema);
