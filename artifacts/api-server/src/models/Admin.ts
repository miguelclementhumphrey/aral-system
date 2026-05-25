import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdmin extends Document {
  username: string;
  passwordHash: string;
  failedAttempts: number;
  lockedUntil?: Date;
  comparePassword(password: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdmin>({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  failedAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date },
}, { timestamps: true });

AdminSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const Admin = mongoose.model<IAdmin>("Admin", AdminSchema);
