import { Router, Response } from "express";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import { SchoolHeadProfile } from "../models/SchoolHeadProfile";
import { School } from "../models/School";
import { GradeLevel } from "../models/GradeLevel";
import { Teacher } from "../models/Teacher";
import { Learner } from "../models/Learner";

const router = Router();
router.use(authenticate, requireRole("school_head"));

// GET /api/school-head/profile
router.get("/profile", async (req: AuthRequest, res: Response) => {
  try {
    const profile = await SchoolHeadProfile.findOne({ schoolId: req.user!.schoolId }).lean();
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json({
      id: (profile as any)._id.toString(),
      schoolId: (profile as any).schoolId.toString(),
      firstName: profile.firstName, middleName: profile.middleName ?? null,
      lastName: profile.lastName, designation: profile.designation, position: profile.position,
      contactNumber: profile.contactNumber, email: profile.email, district: profile.district,
      division: profile.division, schoolYear: profile.schoolYear,
      highestEducationalAttainment: profile.highestEducationalAttainment,
      yearsInService: profile.yearsInService, fieldOfSpecialization: profile.fieldOfSpecialization,
      trainingsAttended: profile.trainingsAttended, isComplete: profile.isComplete,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/school-head/profile
router.post("/profile", async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId!;
    const data = req.body;
    const required = ["firstName", "lastName", "designation", "position", "contactNumber", "email", "district", "division", "schoolYear", "highestEducationalAttainment", "yearsInService", "fieldOfSpecialization"];
    const missing = required.filter((f) => !data[f]);
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
      return;
    }
    const isComplete = true;
    const profile = await SchoolHeadProfile.findOneAndUpdate(
      { schoolId },
      { ...data, schoolId, isComplete, trainingsAttended: data.trainingsAttended || [] },
      { upsert: true, new: true }
    ).lean();
    await School.findByIdAndUpdate(schoolId, { profileComplete: true });
    res.json({
      id: (profile as any)._id.toString(), schoolId: (profile as any).schoolId.toString(),
      firstName: profile.firstName, middleName: profile.middleName ?? null,
      lastName: profile.lastName, designation: profile.designation, position: profile.position,
      contactNumber: profile.contactNumber, email: profile.email, district: profile.district,
      division: profile.division, schoolYear: profile.schoolYear,
      highestEducationalAttainment: profile.highestEducationalAttainment,
      yearsInService: profile.yearsInService, fieldOfSpecialization: profile.fieldOfSpecialization,
      trainingsAttended: profile.trainingsAttended, isComplete: profile.isComplete,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
