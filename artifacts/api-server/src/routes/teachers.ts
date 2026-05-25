import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import { Teacher } from "../models/Teacher";
import { TeacherProfile } from "../models/TeacherProfile";
import { GradeLevel } from "../models/GradeLevel";
import { Learner } from "../models/Learner";
import { SchoolHeadProfile } from "../models/SchoolHeadProfile";

const router = Router();

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
  if (!firstName || !lastName || !gradeLevelId) {
    res.status(400).json({ error: "First name, last name, and grade level are required." });
    return;
  }
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

    const pin = generatePin();
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
    const profile = await TeacherProfile.findOne({ teacherId: req.user!.teacherId }).lean();
    if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }
    res.json({
      id: (profile as any)._id.toString(), teacherId: (profile as any).teacherId.toString(),
      age: profile.age ?? null, sex: profile.sex ?? null, dateOfBirth: profile.dateOfBirth ?? null,
      yearsInService: profile.yearsInService, highestEducationalAttainment: profile.highestEducationalAttainment,
      fieldOfSpecialization: profile.fieldOfSpecialization, currentGradeLevel: profile.currentGradeLevel,
      contactNumber: profile.contactNumber, mostSubjectHandled: profile.mostSubjectHandled,
      trainingsAttended: profile.trainingsAttended, isComplete: profile.isComplete,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/teachers/profile - teacher saves own profile
router.post("/profile", authenticate, requireRole("teacher"), async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user!.teacherId!;
    const data = req.body;
    const required = ["yearsInService", "highestEducationalAttainment", "fieldOfSpecialization", "currentGradeLevel", "contactNumber", "mostSubjectHandled"];
    const missing = required.filter((f) => !data[f]);
    if (missing.length > 0) { res.status(400).json({ error: `Missing: ${missing.join(", ")}` }); return; }

    const profile = await TeacherProfile.findOneAndUpdate(
      { teacherId },
      { ...data, teacherId, isComplete: true, trainingsAttended: data.trainingsAttended || [] },
      { upsert: true, new: true }
    ).lean();
    await Teacher.findByIdAndUpdate(teacherId, { profileComplete: true });
    res.json({
      id: (profile as any)._id.toString(), teacherId: (profile as any).teacherId.toString(),
      age: profile.age ?? null, sex: profile.sex ?? null, dateOfBirth: profile.dateOfBirth ?? null,
      yearsInService: profile.yearsInService, highestEducationalAttainment: profile.highestEducationalAttainment,
      fieldOfSpecialization: profile.fieldOfSpecialization, currentGradeLevel: profile.currentGradeLevel,
      contactNumber: profile.contactNumber, mostSubjectHandled: profile.mostSubjectHandled,
      trainingsAttended: profile.trainingsAttended, isComplete: profile.isComplete,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/teachers/:teacherId
router.get("/:teacherId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.teacherId, schoolId: req.user!.schoolId }).lean();
    if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
    res.json(await formatTeacher(teacher));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
