import mongoose, { Document, Schema } from "mongoose";

export interface IAralAdditionalProfile extends Document {
  learnerId: mongoose.Types.ObjectId;
  frequencyOfAbsenteeism?: string;
  interventions: string[];
  recommendedAssessment?: string;
  otherObservations?: string;
  isComplete: boolean;
  updatedAt: Date;
}

const AralAdditionalProfileSchema = new Schema<IAralAdditionalProfile>({
  learnerId: { type: Schema.Types.ObjectId, ref: "Learner", required: true, unique: true },
  frequencyOfAbsenteeism: { type: String },
  interventions: [{ type: String }],
  recommendedAssessment: { type: String },
  otherObservations: { type: String },
  isComplete: { type: Boolean, default: false },
}, { timestamps: true });

export const AralAdditionalProfile = mongoose.model<IAralAdditionalProfile>("AralAdditionalProfile", AralAdditionalProfileSchema);
