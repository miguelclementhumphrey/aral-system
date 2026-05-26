import { Router, Response } from "express";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import { SchoolHeadProfile } from "../models/SchoolHeadProfile";
import { School } from "../models/School";
import { GradeLevel } from "../models/GradeLevel";
import { Teacher } from "../models/Teacher";
import { Learner } from "../models/Learner";
import { pickFields } from "../lib/security";

const router = Router();
router.use(authenticate, requireRole("school_head"));

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

const formatSchoolHeadProfile = (profile: any) => {
  const profileName = profile.name ?? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ");

  return {
    id: profile._id.toString(),
    schoolId: profile.schoolId.toString(),
    name: profileName || null,
    firstName: profile.firstName ?? null,
    middleName: profile.middleName ?? null,
    lastName: profile.lastName ?? null,
    designation: profile.designation,
    designationOther: profile.designationOther ?? null,
    position: profile.position,
    contactNumber: profile.contactNumber,
    email: profile.email,
    district: profile.district ?? null,
    division: profile.division ?? null,
    schoolYear: profile.schoolYear ?? null,
    highestEducationalAttainment: profile.highestEducationalAttainment,
    yearsInService: profile.yearsInService,
    fieldOfSpecialization: profile.fieldOfSpecialization,
    fieldOfSpecializationOther: profile.fieldOfSpecializationOther ?? null,
    trainingsAttended: profile.trainingsAttended ?? [],
    literacyTrainingAttended: profile.literacyTrainingAttended ?? null,
    readingTrainingsAttended: profile.readingTrainingsAttended ?? [],
    englishTrainingAttended: profile.englishTrainingAttended ?? null,
    englishTrainingsAttended: profile.englishTrainingsAttended ?? [],
    highestTrainingLevel: profile.highestTrainingLevel ?? null,
    isComplete: profile.isComplete,
  };
};

// GET /api/school-head/profile
router.get("/profile", async (req: AuthRequest, res: Response) => {
  try {
    const profile = await SchoolHeadProfile.findOne({ schoolId: req.user!.schoolId }).lean();
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(formatSchoolHeadProfile(profile));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/school-head/profile
router.post("/profile", async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId!;
    const data = cleanProfileData(pickFields(req.body, [
      "name", "firstName", "middleName", "lastName", "designation", "designationOther", "position", "contactNumber", "email", "district",
      "division", "schoolYear", "highestEducationalAttainment", "yearsInService", "fieldOfSpecialization",
      "fieldOfSpecializationOther", "trainingsAttended", "literacyTrainingAttended", "readingTrainingsAttended",
      "englishTrainingAttended", "englishTrainingsAttended", "highestTrainingLevel",
    ] as const));
    const required = ["designation", "position", "contactNumber", "email", "highestEducationalAttainment", "yearsInService", "fieldOfSpecialization", "literacyTrainingAttended", "englishTrainingAttended", "highestTrainingLevel"];
    const missing = required.filter((f) => !data[f]);
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
      return;
    }
    const readingTrainingsAttended = cleanStringArray(data.readingTrainingsAttended);
    const englishTrainingsAttended = cleanStringArray(data.englishTrainingsAttended);
    const trainingsAttended = uniqueStrings(data.trainingsAttended, readingTrainingsAttended, englishTrainingsAttended);
    const isComplete = true;
    const profile = await SchoolHeadProfile.findOneAndUpdate(
      { schoolId },
      {
        $set: {
          name: cleanString(data.name),
          designation: cleanString(data.designation),
          designationOther: cleanString(data.designationOther),
          position: cleanString(data.position),
          contactNumber: cleanString(data.contactNumber),
          email: cleanString(data.email),
          highestEducationalAttainment: cleanString(data.highestEducationalAttainment),
          yearsInService: cleanString(data.yearsInService),
          fieldOfSpecialization: cleanString(data.fieldOfSpecialization),
          fieldOfSpecializationOther: cleanString(data.fieldOfSpecializationOther),
          literacyTrainingAttended: cleanString(data.literacyTrainingAttended),
          englishTrainingAttended: cleanString(data.englishTrainingAttended),
          highestTrainingLevel: cleanString(data.highestTrainingLevel),
          schoolId,
          isComplete,
          trainingsAttended,
          readingTrainingsAttended,
          englishTrainingsAttended,
        },
        $unset: {
          firstName: "",
          middleName: "",
          lastName: "",
          district: "",
          division: "",
          schoolYear: "",
        },
      },
      { upsert: true, new: true }
    ).lean();
    await School.findByIdAndUpdate(schoolId, { profileComplete: true });
    res.json(formatSchoolHeadProfile(profile));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
