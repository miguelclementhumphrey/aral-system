import mongoose, { Document, Schema } from "mongoose";

export interface IGradeLevel extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

const GradeLevelSchema = new Schema<IGradeLevel>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

GradeLevelSchema.index({ schoolId: 1, name: 1 }, { unique: true });

export const GradeLevel = mongoose.model<IGradeLevel>("GradeLevel", GradeLevelSchema);
