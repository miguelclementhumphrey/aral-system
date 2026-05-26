import mongoose, { Document, Schema } from "mongoose";

export interface ISchoolHeadProfile extends Document {
  schoolId: mongoose.Types.ObjectId;
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  designation: string;
  designationOther?: string;
  position: string;
  contactNumber: string;
  email: string;
  district?: string;
  division?: string;
  schoolYear?: string;
  highestEducationalAttainment: string;
  yearsInService: string;
  fieldOfSpecialization: string;
  fieldOfSpecializationOther?: string;
  trainingsAttended: string[];
  literacyTrainingAttended?: string;
  readingTrainingsAttended: string[];
  englishTrainingAttended?: string;
  englishTrainingsAttended: string[];
  highestTrainingLevel?: string;
  isComplete: boolean;
}

const SchoolHeadProfileSchema = new Schema<ISchoolHeadProfile>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, unique: true },
  name: { type: String },
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  designation: { type: String, required: true },
  designationOther: { type: String },
  position: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },
  district: { type: String },
  division: { type: String },
  schoolYear: { type: String },
  highestEducationalAttainment: { type: String, required: true },
  yearsInService: { type: String, required: true },
  fieldOfSpecialization: { type: String, required: true },
  fieldOfSpecializationOther: { type: String },
  trainingsAttended: { type: [String], default: [] },
  literacyTrainingAttended: { type: String, enum: ["Yes", "No", "yes", "no"] },
  readingTrainingsAttended: { type: [String], default: [] },
  englishTrainingAttended: { type: String, enum: ["Yes", "No", "yes", "no"] },
  englishTrainingsAttended: { type: [String], default: [] },
  highestTrainingLevel: { type: String },
  isComplete: { type: Boolean, default: false },
}, { timestamps: true });

export const SchoolHeadProfile = mongoose.model<ISchoolHeadProfile>("SchoolHeadProfile", SchoolHeadProfileSchema);
