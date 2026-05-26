import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface ITeacher extends Document {
  schoolId: mongoose.Types.ObjectId;
  gradeLevelId: mongoose.Types.ObjectId;
  firstName: string;
  middleName?: string;
  lastName: string;
  pin: string;
  pinHash: string;
  isActive: boolean;
  profileComplete: boolean;
  createdAt: Date;
  comparePin(pin: string): Promise<boolean>;
}

const TeacherSchema = new Schema<ITeacher>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  gradeLevelId: { type: Schema.Types.ObjectId, ref: "GradeLevel", required: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  pin: { type: String },
  pinHash: { type: String },
  isActive: { type: Boolean, default: true },
  profileComplete: { type: Boolean, default: false },
}, { timestamps: true });

TeacherSchema.methods.comparePin = async function (pin: string): Promise<boolean> {
  const candidate = String(pin).trim();
  if (!this.pinHash) return false;
  return bcrypt.compare(candidate, this.pinHash);
};

export const Teacher = mongoose.model<ITeacher>("Teacher", TeacherSchema);
