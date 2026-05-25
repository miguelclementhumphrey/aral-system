import mongoose, { Document, Schema } from "mongoose";

export interface ILearner extends Document {
  schoolId: mongoose.Types.ObjectId;
  gradeLevelId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  firstName: string;
  middleName?: string;
  lastName: string;
  lrn: string;
  dateOfBirth: string;
  sex: string;
  guardianName: string;
  guardianContact: string;
  address: string;
  isAral: boolean;
  aralFlaggedAt?: Date;
  profileComplete: boolean;
  readingLevelEnglish?: string;
  readingLevelFilipino?: string;
  governmentBenefits: string[];
  parentsEducation?: string;
  modeOfTransportation?: string;
  distanceFromSchool?: string;
  previousTransfers?: string;
  letterRecognition?: string;
  letterSoundCorrespondence?: string;
  wordRecognition?: string;
  homeLiteracyEnvironment?: string;
  parentalSupport?: string;
  classroomLearningEnvironment?: string;
  languageConsiderations?: string;
  suggestedInterventions: string[];
  createdAt: Date;
}

const LearnerSchema = new Schema<ILearner>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  gradeLevelId: { type: Schema.Types.ObjectId, ref: "GradeLevel", required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  lrn: { type: String, required: true, unique: true },
  dateOfBirth: { type: String, required: true },
  sex: { type: String, required: true },
  guardianName: { type: String, required: true },
  guardianContact: { type: String, required: true },
  address: { type: String, required: true },
  isAral: { type: Boolean, default: false },
  aralFlaggedAt: { type: Date },
  profileComplete: { type: Boolean, default: true },
  readingLevelEnglish: { type: String },
  readingLevelFilipino: { type: String },
  governmentBenefits: [{ type: String }],
  parentsEducation: { type: String },
  modeOfTransportation: { type: String },
  distanceFromSchool: { type: String },
  previousTransfers: { type: String },
  letterRecognition: { type: String },
  letterSoundCorrespondence: { type: String },
  wordRecognition: { type: String },
  homeLiteracyEnvironment: { type: String },
  parentalSupport: { type: String },
  classroomLearningEnvironment: { type: String },
  languageConsiderations: { type: String },
  suggestedInterventions: [{ type: String }],
}, { timestamps: true });

export const Learner = mongoose.model<ILearner>("Learner", LearnerSchema);
