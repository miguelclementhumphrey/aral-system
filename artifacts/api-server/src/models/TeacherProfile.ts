import mongoose, { Document, Schema } from "mongoose";

export interface ITeacherProfile extends Document {
  teacherId: mongoose.Types.ObjectId;
  age?: number;
  sex?: string;
  dateOfBirth?: string;
  yearsInService: string;
  highestEducationalAttainment: string;
  fieldOfSpecialization: string;
  currentGradeLevel: string;
  contactNumber: string;
  mostSubjectHandled: string;
  trainingsAttended: string[];
  isComplete: boolean;
}

const TeacherProfileSchema = new Schema<ITeacherProfile>({
  teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true, unique: true },
  age: { type: Number },
  sex: { type: String },
  dateOfBirth: { type: String },
  yearsInService: { type: String, required: true },
  highestEducationalAttainment: { type: String, required: true },
  fieldOfSpecialization: { type: String, required: true },
  currentGradeLevel: { type: String, required: true },
  contactNumber: { type: String, required: true },
  mostSubjectHandled: { type: String, required: true },
  trainingsAttended: [{ type: String }],
  isComplete: { type: Boolean, default: false },
}, { timestamps: true });

export const TeacherProfile = mongoose.model<ITeacherProfile>("TeacherProfile", TeacherProfileSchema);
