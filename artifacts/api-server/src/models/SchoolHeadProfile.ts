import mongoose, { Document, Schema } from "mongoose";

export interface ISchoolHeadProfile extends Document {
  schoolId: mongoose.Types.ObjectId;
  firstName: string;
  middleName?: string;
  lastName: string;
  designation: string;
  position: string;
  contactNumber: string;
  email: string;
  district: string;
  division: string;
  schoolYear: string;
  highestEducationalAttainment: string;
  yearsInService: string;
  fieldOfSpecialization: string;
  trainingsAttended: string[];
  isComplete: boolean;
}

const SchoolHeadProfileSchema = new Schema<ISchoolHeadProfile>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, unique: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  designation: { type: String, required: true },
  position: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },
  district: { type: String, required: true },
  division: { type: String, required: true },
  schoolYear: { type: String, required: true },
  highestEducationalAttainment: { type: String, required: true },
  yearsInService: { type: String, required: true },
  fieldOfSpecialization: { type: String, required: true },
  trainingsAttended: [{ type: String }],
  isComplete: { type: Boolean, default: false },
}, { timestamps: true });

export const SchoolHeadProfile = mongoose.model<ISchoolHeadProfile>("SchoolHeadProfile", SchoolHeadProfileSchema);
