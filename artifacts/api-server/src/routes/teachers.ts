import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import { Teacher } from "../models/Teacher";
import { TeacherProfile } from "../models/TeacherProfile";
import { GradeLevel } from "../models/GradeLevel";
import { Learner } from "../models/Learner";
import { SchoolHeadProfile } from "../models/SchoolHeadProfile";
import { Attendance } from "../models/Attendance";
import { ReadingLevel } from "../models/ReadingLevel";
import { AralAdditionalProfile } from "../models/AralAdditionalProfile";
import { isObjectId, pickFields } from "../lib/security";

const router = Router();

const currentSchoolYear = () => {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
};

const cleanString = (value: unknown): string => {
  return typeof value === "string" ? value.trim() : "";
};

const cleanStringArray = (value: unknown): string[] => {
  return Array.isArray(value)
    ? value.map(cleanString).filter(Boolean)
    : [];
};

const cleanProfileData = (data: Record<string, unknown>) => {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      Array.isArray(value) ? cleanStringArray(value) : typeof value === "string" ? value.trim() : value,
    ]),
  ) as Record<string, any>;
};

const uniqueStrings = (...groups: unknown[]): string[] => {
  return Array.from(new Set(groups.flatMap(cleanStringArray)));
};

async function getAssignedGradeLevelName(teacher: any): Promise<string> {
  const gradeLevel = await GradeLevel.findOne({ _id: teacher.gradeLevelId, schoolId: teacher.schoolId }).lean();
  return (gradeLevel as any)?.name ?? "";
}

async function formatTeacher(t: any): Promise<object> {
  const gl = await GradeLevel.findById(t.gradeLevelId).lean();
  const learnersCount = await Learner.countDocuments({ teacherId: t._id });
  return {
    id: t._id.toString(), schoolId: t.schoolId.toString(),
    gradeLevelId: t.gradeLevelId.toString(), gradeLevelName: (gl as any)?.name ?? "",
    firstName: t.firstName, middleName: t.middleName ?? null, lastName: t.lastName,
    pin: t.pin ?? null, profileComplete: t.profileComplete, isActive: t.isActive,
    learnersCount, createdAt: t.createdAt.toISOString(),
  };
}

function formatTeacherProfile(profile: any, assignedGradeLevelName?: string): object {
  return {
    id: profile._id.toString(),
    teacherId: profile.teacherId.toString(),
    name: profile.name ?? null,
    age: profile.age ?? null,
    sex: profile.sex ?? null,
    dateOfBirth: profile.dateOfBirth ?? null,
    designation: profile.designation,
    designationOther: profile.designationOther ?? null,
    position: profile.position,
    email: profile.email,
    district: profile.district ?? null,
    division: profile.division ?? null,
    schoolYear: profile.schoolYear ?? null,
    yearsInService: profile.yearsInService,
    highestEducationalAttainment: profile.highestEducationalAttainment,
    fieldOfSpecialization: profile.fieldOfSpecialization,
    fieldOfSpecializationOther: profile.fieldOfSpecializationOther ?? null,
    currentGradeLevel: assignedGradeLevelName || profile.currentGradeLevel,
    contactNumber: profile.contactNumber,
    mostSubjectHandled: profile.mostSubjectHandled,
    trainingsAttended: profile.trainingsAttended ?? [],
    literacyTrainingAttended: profile.literacyTrainingAttended ?? null,
    readingTrainingsAttended: profile.readingTrainingsAttended ?? [],
    englishTrainingAttended: profile.englishTrainingAttended ?? null,
    englishTrainingsAttended: profile.englishTrainingsAttended ?? [],
    highestTrainingLevel: profile.highestTrainingLevel ?? null,
    isComplete: profile.isComplete,
  };
}

// GET /api/teachers - school head or teacher can view
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId!;
    const teachers = await Teacher.find({ schoolId }).sort({ createdAt: 1 }).lean();
    const result = await Promise.all(teachers.map(formatTeacher));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/teachers - school head only
router.post("/", authenticate, requireRole("school_head"), async (req: AuthRequest, res: Response) => {
  const schoolId = req.user!.schoolId!;
  const { firstName, middleName, lastName, gradeLevelId } = req.body;
  const pin = String(req.body.pin ?? "").trim();
  if (!firstName || !lastName || !gradeLevelId || !pin) {
    res.status(400).json({ error: "First name, last name, grade level, and PIN are required." });
    return;
  }
  if (!/^\d{4,12}$/.test(pin)) {
    res.status(400).json({ error: "PIN must be 4 to 12 digits." });
    return;
  }
  if (!isObjectId(gradeLevelId)) { res.status(400).json({ error: "Invalid grade level ID" }); return; }
  try {
    const profile = await SchoolHeadProfile.findOne({ schoolId });
    if (!profile || !profile.isComplete) {
      res.status(403).json({ error: "Complete your profile first." });
      return;
    }
    const gl = await GradeLevel.findOne({ _id: gradeLevelId, schoolId });
    if (!gl) { res.status(404).json({ error: "Grade level not found." }); return; }

    const existing = await Teacher.findOne({ schoolId, gradeLevelId, firstName, lastName });
    if (existing) { res.status(409).json({ error: `A teacher named ${firstName} ${lastName} already exists in this grade level.` }); return; }

    const pinHash = await bcrypt.hash(pin, 10);
    const teacher = await Teacher.create({ schoolId, gradeLevelId, firstName, middleName, lastName, pin, pinHash, isActive: true, profileComplete: false });
    res.status(201).json(await formatTeacher({ ...teacher.toObject(), pin }));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/teachers/profile - teacher gets own profile
router.get("/profile", authenticate, requireRole("teacher"), async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await Teacher.findById(req.user!.teacherId).lean();
    if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
    const assignedGradeLevelName = await getAssignedGradeLevelName(teacher);
    const profile = await TeacherProfile.findOne({ teacherId: req.user!.teacherId }).lean();
    if (!profile) {
      res.json({
        id: "",
        teacherId: teacher._id.toString(),
        name: null,
        age: null,
        sex: null,
        dateOfBirth: null,
        designation: "",
        designationOther: null,
        position: "",
        email: "",
        district: null,
        division: null,
        schoolYear: null,
        yearsInService: "",
        highestEducationalAttainment: "",
        fieldOfSpecialization: "",
        fieldOfSpecializationOther: null,
        currentGradeLevel: assignedGradeLevelName,
        contactNumber: "",
        mostSubjectHandled: "",
        trainingsAttended: [],
        literacyTrainingAttended: null,
        readingTrainingsAttended: [],
        englishTrainingAttended: null,
        englishTrainingsAttended: [],
        highestTrainingLevel: null,
        isComplete: false,
      });
      return;
    }
    res.json(formatTeacherProfile(profile, assignedGradeLevelName));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/teachers/:teacherId/profile - school head views a teacher profile in their school
router.get("/:teacherId/profile", authenticate, requireRole("school_head"), async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId!;
    if (!isObjectId(req.params.teacherId)) {
      res.status(400).json({ error: "Invalid teacher ID" });
      return;
    }

    const teacher = await Teacher.findOne({ _id: req.params.teacherId, schoolId }).lean();
    if (!teacher) {
      res.status(404).json({ error: "Teacher not found" });
      return;
    }
    if (!teacher.profileComplete) {
      res.status(409).json({ error: "Teacher profile is not complete yet." });
      return;
    }

    const profile = await TeacherProfile.findOne({ teacherId: teacher._id }).lean();
    if (!profile) {
      res.status(404).json({ error: "Teacher profile not found" });
      return;
    }

    const assignedGradeLevelName = await getAssignedGradeLevelName(teacher);
    res.json(formatTeacherProfile(profile, assignedGradeLevelName));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/teachers/profile - teacher saves own profile
router.post("/profile", authenticate, requireRole("teacher"), async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user!.teacherId!;
    const teacher = await Teacher.findById(teacherId).lean();
    if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
    const assignedGradeLevelName = await getAssignedGradeLevelName(teacher);
    if (!assignedGradeLevelName) { res.status(400).json({ error: "Assigned grade level not found." }); return; }

    const data = cleanProfileData(pickFields(req.body, [
      "name", "age", "sex", "dateOfBirth", "designation", "designationOther", "position", "email", "district", "division",
      "schoolYear", "yearsInService", "highestEducationalAttainment", "fieldOfSpecialization", "fieldOfSpecializationOther",
      "currentGradeLevel", "contactNumber", "mostSubjectHandled", "trainingsAttended", "literacyTrainingAttended",
      "readingTrainingsAttended", "englishTrainingAttended", "englishTrainingsAttended", "highestTrainingLevel",
    ] as const));
    const required = [
      "designation", "position", "contactNumber", "email",
      "yearsInService", "highestEducationalAttainment", "fieldOfSpecialization",
      "mostSubjectHandled", "literacyTrainingAttended", "englishTrainingAttended", "highestTrainingLevel",
    ];
    const missing = required.filter((f) => !data[f]);
    if (missing.length > 0) { res.status(400).json({ error: `Missing: ${missing.join(", ")}` }); return; }

    const readingTrainingsAttended = cleanStringArray(data.readingTrainingsAttended);
    const englishTrainingsAttended = cleanStringArray(data.englishTrainingsAttended);
    const trainingsAttended = uniqueStrings(data.trainingsAttended, readingTrainingsAttended, englishTrainingsAttended);
    const [profile] = await Promise.all([
      TeacherProfile.findOneAndUpdate(
        { teacherId },
        {
          name: cleanString(data.name),
          age: typeof data.age === "number" ? data.age : undefined,
          sex: cleanString(data.sex),
          dateOfBirth: cleanString(data.dateOfBirth),
          designation: cleanString(data.designation),
          designationOther: cleanString(data.designationOther),
          position: cleanString(data.position),
          email: cleanString(data.email),
          district: cleanString(data.district) || "N/A",
          division: cleanString(data.division) || "N/A",
          schoolYear: cleanString(data.schoolYear) || currentSchoolYear(),
          yearsInService: cleanString(data.yearsInService),
          highestEducationalAttainment: cleanString(data.highestEducationalAttainment),
          fieldOfSpecialization: cleanString(data.fieldOfSpecialization),
          fieldOfSpecializationOther: cleanString(data.fieldOfSpecializationOther),
          currentGradeLevel: assignedGradeLevelName,
          contactNumber: cleanString(data.contactNumber),
          mostSubjectHandled: cleanString(data.mostSubjectHandled),
          literacyTrainingAttended: cleanString(data.literacyTrainingAttended),
          englishTrainingAttended: cleanString(data.englishTrainingAttended),
          highestTrainingLevel: cleanString(data.highestTrainingLevel),
          teacherId,
          isComplete: true,
          trainingsAttended,
          readingTrainingsAttended,
          englishTrainingsAttended,
        },
        { upsert: true, new: true }
      ).lean(),
      Teacher.findByIdAndUpdate(teacherId, { profileComplete: true }).lean(),
    ]);
    res.json(formatTeacherProfile(profile, assignedGradeLevelName));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/teachers/:teacherId
router.get("/:teacherId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!isObjectId(req.params.teacherId)) { res.status(400).json({ error: "Invalid teacher ID" }); return; }
    const teacher = await Teacher.findOne({ _id: req.params.teacherId, schoolId: req.user!.schoolId }).lean();
    if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
    res.json(await formatTeacher(teacher));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/teachers/:teacherId - school head only
router.delete("/:teacherId", authenticate, requireRole("school_head"), async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId!;
    if (!isObjectId(req.params.teacherId)) { res.status(400).json({ error: "Invalid teacher ID" }); return; }

    const teacher = await Teacher.findOne({ _id: req.params.teacherId, schoolId });
    if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }

    const learners = await Learner.find({ teacherId: teacher._id, schoolId }).select("_id").lean();
    const learnerIds = learners.map((learner: any) => learner._id);

    await Promise.all([
      Attendance.deleteMany({ schoolId, learnerId: { $in: learnerIds } }),
      ReadingLevel.deleteMany({ schoolId, learnerId: { $in: learnerIds } }),
      AralAdditionalProfile.deleteMany({ learnerId: { $in: learnerIds } }),
      Learner.deleteMany({ teacherId: teacher._id, schoolId }),
      TeacherProfile.deleteMany({ teacherId: teacher._id }),
    ]);

    await Teacher.deleteOne({ _id: teacher._id, schoolId });
    res.json({ success: true, message: "Teacher and connected records deleted." });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
