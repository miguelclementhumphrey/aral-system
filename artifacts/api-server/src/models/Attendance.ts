import mongoose, { Document, Schema } from "mongoose";

export interface IAttendance extends Document {
  learnerId: mongoose.Types.ObjectId;
  gradeLevelId: mongoose.Types.ObjectId;
  schoolId: mongoose.Types.ObjectId;
  weekStartDate: string;
  weekEndDate: string;
  monday?: "present" | "absent" | "late";
  tuesday?: "present" | "absent" | "late";
  wednesday?: "present" | "absent" | "late";
  thursday?: "present" | "absent" | "late";
  friday?: "present" | "absent" | "late";
  totalAbsences: number;
  isLocked: boolean;
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  learnerId: { type: Schema.Types.ObjectId, ref: "Learner", required: true },
  gradeLevelId: { type: Schema.Types.ObjectId, ref: "GradeLevel", required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  weekStartDate: { type: String, required: true },
  weekEndDate: { type: String },
  monday: { type: String, enum: ["present", "absent", "late"] },
  tuesday: { type: String, enum: ["present", "absent", "late"] },
  wednesday: { type: String, enum: ["present", "absent", "late"] },
  thursday: { type: String, enum: ["present", "absent", "late"] },
  friday: { type: String, enum: ["present", "absent", "late"] },
  totalAbsences: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
}, { timestamps: true });

AttendanceSchema.index({ learnerId: 1, weekStartDate: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>("Attendance", AttendanceSchema);
