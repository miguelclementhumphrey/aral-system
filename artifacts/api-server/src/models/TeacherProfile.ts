import mongoose, { Document, Schema } from "mongoose";

export interface ITeacherProfile extends Document {
  teacherId: mongoose.Types.ObjectId;
  name?: string;
  age?: number;
  sex?: string;
  dateOfBirth?: string;
  designation: string;
  designationOther?: string;
  position: string;
  email: string;
  district?: string;
  division?: string;
  schoolYear?: string;
  yearsInService: string;
  highestEducationalAttainment: string;
  fieldOfSpecialization: string;
  fieldOfSpecializationOther?: string;
  currentGradeLevel: string;
  contactNumber: string;
  mostSubjectHandled: string;
  trainingsAttended: string[];
  literacyTrainingAttended?: string;
  readingTrainingsAttended: string[];
  englishTrainingAttended?: string;
  englishTrainingsAttended: string[];
  highestTrainingLevel?: string;
  isComplete: boolean;
}

const TeacherProfileSchema = new Schema<ITeacherProfile>({
  teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, unique: true },
  name: { type: String },
  age: { type: Number },
  sex: { type: String },
  dateOfBirth: { type: String },
  designation: { type: String, required: true },
  designationOther: { type: String },
  position: { type: String, required: true },
  email: { type: String, required: true },
  district: { type: String },
  division: { type: String },
  schoolYear: { type: String },
  yearsInService: { type: String, required: true },
  highestEducationalAttainment: { type: String, required: true },
  fieldOfSpecialization: { type: String, required: true },
  fieldOfSpecializationOther: { type: String },
  currentGradeLevel: { type: String, required: true },
  contactNumber: { type: String, required: true },
  mostSubjectHandled: { type: String, required: true },
  trainingsAttended: { type: [String], default: [] },
  literacyTrainingAttended: { type: String, enum: ["Yes", "No", "yes", "no"] },
  readingTrainingsAttended: { type: [String], default: [] },
  englishTrainingAttended: { type: String, enum: ["Yes", "No", "yes", "no"] },
  englishTrainingsAttended: { type: [String], default: [] },
  highestTrainingLevel: { type: String },
  isComplete: { type: Boolean, default: false },
}, { timestamps: true });

export const TeacherProfile = mongoose.model<ITeacherProfile>("TeacherProfile", TeacherProfileSchema);
