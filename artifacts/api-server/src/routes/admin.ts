import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import { School } from "../models/School";
import { Teacher } from "../models/Teacher";
import { Learner } from "../models/Learner";
import { GradeLevel } from "../models/GradeLevel";

const router = Router();
router.use(authenticate, requireRole("super_admin"));

function generateSchoolCode(): string {
  return "SCH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function getSchoolStats(schoolId: string) {
  const [teachers, learners, aralLearners] = await Promise.all([
    Teacher.countDocuments({ schoolId }),
    Learner.countDocuments({ schoolId }),
    Learner.countDocuments({ schoolId, isAral: true }),
  ]);
  return { teachersCount: teachers, learnersCount: learners, aralLearnersCount: aralLearners };
}

// GET /api/admin/schools
router.get("/schools", async (req: AuthRequest, res: Response) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 }).lean();
    const result = await Promise.all(schools.map(async (s: any) => {
      const stats = await getSchoolStats(s._id.toString());
      return {
        id: s._id.toString(),
        name: s.name,
        schoolCode: s.schoolCode,
        division: s.division || "",
        district: s.district || "",
        region: s.region || "",
        schoolHeadName: s.schoolHeadName,
        schoolHeadContact: s.schoolHeadContact || "",
        status: s.status,
        profileComplete: s.profileComplete,
        lastLoginAt: s.lastLoginAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        ...stats,
      };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/schools
router.post("/schools", async (req: AuthRequest, res: Response) => {
  const { name, division, district, region, schoolHeadName, schoolHeadContact } = req.body;
  if (!name || !division || !district || !region || !schoolHeadName || !schoolHeadContact) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }
  try {
    let schoolCode = generateSchoolCode();
    let exists = await School.findOne({ schoolCode });
    while (exists) {
      schoolCode = generateSchoolCode();
      exists = await School.findOne({ schoolCode });
    }
    const school = await School.create({ name, schoolCode, division, district, region, schoolHeadName, schoolHeadContact, status: "pending" });
    res.status(201).json({
      id: school._id.toString(), name: school.name, schoolCode: school.schoolCode,
      division: school.division, district: school.district, region: school.region,
      schoolHeadName: school.schoolHeadName, schoolHeadContact: school.schoolHeadContact,
      status: school.status, profileComplete: false, teachersCount: 0, learnersCount: 0, aralLearnersCount: 0,
      lastLoginAt: null, createdAt: school.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/schools/:schoolId
router.get("/schools/:schoolId", async (req: AuthRequest, res: Response) => {
  try {
    const school = await School.findById(req.params.schoolId).lean();
    if (!school) { res.status(404).json({ error: "School not found" }); return; }
    const stats = await getSchoolStats(req.params.schoolId);
    res.json({
      id: (school as any)._id.toString(), name: school.name, schoolCode: school.schoolCode,
      division: school.division || "", district: school.district || "", region: school.region || "",
      schoolHeadName: school.schoolHeadName, schoolHeadContact: school.schoolHeadContact || "",
      status: school.status, profileComplete: school.profileComplete,
      lastLoginAt: school.lastLoginAt?.toISOString() ?? null, createdAt: school.createdAt.toISOString(), ...stats,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/admin/schools/:schoolId
router.patch("/schools/:schoolId", async (req: AuthRequest, res: Response) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.schoolId, { $set: req.body }, { new: true }).lean();
    if (!school) { res.status(404).json({ error: "School not found" }); return; }
    const stats = await getSchoolStats(req.params.schoolId);
    res.json({
      id: (school as any)._id.toString(), name: school.name, schoolCode: school.schoolCode,
      division: school.division || "", district: school.district || "", region: school.region || "",
      schoolHeadName: school.schoolHeadName, schoolHeadContact: school.schoolHeadContact || "",
      status: school.status, profileComplete: school.profileComplete,
      lastLoginAt: school.lastLoginAt?.toISOString() ?? null, createdAt: school.createdAt.toISOString(), ...stats,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/schools/:schoolId/activate
router.post("/schools/:schoolId/activate", async (req: AuthRequest, res: Response) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.schoolId, { status: "active" }, { new: true }).lean();
    if (!school) { res.status(404).json({ error: "School not found" }); return; }
    const stats = await getSchoolStats(req.params.schoolId);
    res.json({
      id: (school as any)._id.toString(), name: school.name, schoolCode: school.schoolCode,
      division: school.division || "", district: school.district || "", region: school.region || "",
      schoolHeadName: school.schoolHeadName, schoolHeadContact: school.schoolHeadContact || "",
      status: school.status, profileComplete: school.profileComplete,
      lastLoginAt: school.lastLoginAt?.toISOString() ?? null, createdAt: school.createdAt.toISOString(), ...stats,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/schools/:schoolId/suspend
router.post("/schools/:schoolId/suspend", async (req: AuthRequest, res: Response) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.schoolId, { status: "suspended" }, { new: true }).lean();
    if (!school) { res.status(404).json({ error: "School not found" }); return; }
    const stats = await getSchoolStats(req.params.schoolId);
    res.json({
      id: (school as any)._id.toString(), name: school.name, schoolCode: school.schoolCode,
      division: school.division || "", district: school.district || "", region: school.region || "",
      schoolHeadName: school.schoolHeadName, schoolHeadContact: school.schoolHeadContact || "",
      status: school.status, profileComplete: school.profileComplete,
      lastLoginAt: school.lastLoginAt?.toISOString() ?? null, createdAt: school.createdAt.toISOString(), ...stats,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/schools/:schoolId/reset-password
router.post("/schools/:schoolId/reset-password", async (req: AuthRequest, res: Response) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.schoolId, { isFirstLogin: true, passwordHash: undefined, failedAttempts: 0, lockedUntil: undefined }, { new: true });
    if (!school) { res.status(404).json({ error: "School not found" }); return; }
    res.json({ success: true, message: `Password reset. School Head should use School Code: ${school.schoolCode} to login.` });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/stats
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const [totalSchools, activeSchools, pendingSchools, suspendedSchools, totalTeachers, totalLearners, totalAralLearners] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ status: "active" }),
      School.countDocuments({ status: "pending" }),
      School.countDocuments({ status: "suspended" }),
      Teacher.countDocuments(),
      Learner.countDocuments(),
      Learner.countDocuments({ isAral: true }),
    ]);
    res.json({ totalSchools, activeSchools, pendingSchools, suspendedSchools, totalTeachers, totalLearners, totalAralLearners });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
