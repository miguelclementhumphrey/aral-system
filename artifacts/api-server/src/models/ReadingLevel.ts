import mongoose, { Document, Schema } from "mongoose";

export interface IReadingLevel extends Document {
  learnerId: mongoose.Types.ObjectId;
  gradeLevelId: mongoose.Types.ObjectId;
  schoolId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  readingLevel: string;
  language: "english" | "filipino";
  notes?: string;
  createdAt: Date;
}

const ReadingLevelSchema = new Schema<IReadingLevel>({
  learnerId: { type: Schema.Types.ObjectId, ref: "Learner", required: true },
  gradeLevelId: { type: Schema.Types.ObjectId, ref: "GradeLevel", required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  readingLevel: { type: String, required: true },
  language: { type: String, enum: ["english", "filipino"], required: true },
  notes: { type: String },
}, { timestamps: true });

ReadingLevelSchema.index({ learnerId: 1, month: 1, year: 1, language: 1 }, { unique: true });

export const ReadingLevel = mongoose.model<IReadingLevel>("ReadingLevel", ReadingLevelSchema);
