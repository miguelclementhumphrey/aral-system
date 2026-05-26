import { Router, Response } from "express";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import { Learner } from "../models/Learner";
import { Teacher } from "../models/Teacher";
import { isObjectId, pickFields } from "../lib/security";

const router = Router();
router.use(authenticate, requireRole("teacher"));

function formatLearner(l: any): object {
  return {
    id: l._id.toString(), schoolId: l.schoolId.toString(), gradeLevelId: l.gradeLevelId.toString(),
    teacherId: l.teacherId.toString(), firstName: l.firstName, middleName: l.middleName ?? null,
    lastName: l.lastName, lrn: l.lrn, dateOfBirth: l.dateOfBirth, sex: l.sex,
    guardianName: l.guardianName, guardianContact: l.guardianContact, address: l.address,
    isAral: l.isAral, aralFlaggedAt: l.aralFlaggedAt?.toISOString() ?? null,
    profileComplete: l.profileComplete,
    readingLevelEnglish: l.readingLevelEnglish ?? null, readingLevelFilipino: l.readingLevelFilipino ?? null,
    governmentBenefits: l.governmentBenefits || [], parentsEducation: l.parentsEducation ?? null,
    modeOfTransportation: l.modeOfTransportation ?? null, distanceFromSchool: l.distanceFromSchool ?? null,
    previousTransfers: l.previousTransfers ?? null, letterRecognition: l.letterRecognition ?? null,
    letterSoundCorrespondence: l.letterSoundCorrespondence ?? null, wordRecognition: l.wordRecognition ?? null,
    homeLiteracyEnvironment: l.homeLiteracyEnvironment ?? null, parentalSupport: l.parentalSupport ?? null,
    classroomLearningEnvironment: l.classroomLearningEnvironment ?? null, languageConsiderations: l.languageConsiderations ?? null,
    suggestedInterventions: l.suggestedInterventions || [], createdAt: l.createdAt.toISOString(),
  };
}

// GET /api/learners
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await Teacher.findById(req.user!.teacherId);
    if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
    const learners = await Learner.find({ teacherId: req.user!.teacherId }).sort({ createdAt: 1 }).lean();
    res.json(learners.map(formatLearner));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/learners
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user!.teacherId!;
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
    if (!teacher.profileComplete) {
      res.status(403).json({ error: "Complete your profile to add learners." });
      return;
    }
    const allowedFields = [
      "firstName", "middleName", "lastName", "lrn", "dateOfBirth", "sex", "guardianName", "guardianContact",
      "address", "isAral", "readingLevelEnglish", "readingLevelFilipino", "governmentBenefits", "parentsEducation",
      "modeOfTransportation", "distanceFromSchool", "previousTransfers", "letterRecognition",
      "letterSoundCorrespondence", "wordRecognition", "homeLiteracyEnvironment", "parentalSupport",
      "classroomLearningEnvironment", "languageConsiderations", "suggestedInterventions",
    ] as const;
    const input = pickFields(req.body, allowedFields);
    const { firstName, lastName, lrn, dateOfBirth, sex, guardianName, guardianContact, address } = input;
    if (!firstName || !lastName || !lrn || !dateOfBirth || !sex || !guardianName || !guardianContact || !address) {
      res.status(400).json({ error: "Required learner fields are missing." });
      return;
    }
    const existing = await Learner.findOne({ lrn });
    if (existing) { res.status(409).json({ error: "A learner with this LRN already exists." }); return; }
    const sameName = await Learner.findOne({ gradeLevelId: teacher.gradeLevelId, firstName, lastName });
    if (sameName) {
      // just warn via the response body but allow
    }
    const learner = await Learner.create({
      ...input,
      schoolId: req.user!.schoolId,
      gradeLevelId: teacher.gradeLevelId,
      teacherId,
      aralFlaggedAt: input.isAral ? new Date() : undefined,
      profileComplete: true,
    });
    res.status(201).json(formatLearner(learner));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/learners/:learnerId
router.get("/:learnerId", async (req: AuthRequest, res: Response) => {
  try {
    if (!isObjectId(req.params.learnerId)) { res.status(400).json({ error: "Invalid learner ID" }); return; }
    const learner = await Learner.findOne({ _id: req.params.learnerId, teacherId: req.user!.teacherId }).lean();
    if (!learner) { res.status(404).json({ error: "Learner not found" }); return; }
    res.json(formatLearner(learner));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/learners/:learnerId
router.patch("/:learnerId", async (req: AuthRequest, res: Response) => {
  try {
    if (!isObjectId(req.params.learnerId)) { res.status(400).json({ error: "Invalid learner ID" }); return; }
    const update = pickFields(req.body, [
      "firstName", "middleName", "lastName", "dateOfBirth", "sex", "guardianName", "guardianContact",
      "address", "readingLevelEnglish", "readingLevelFilipino", "governmentBenefits", "parentsEducation",
      "modeOfTransportation", "distanceFromSchool", "previousTransfers", "letterRecognition",
      "letterSoundCorrespondence", "wordRecognition", "homeLiteracyEnvironment", "parentalSupport",
      "classroomLearningEnvironment", "languageConsiderations", "suggestedInterventions",
    ] as const);
    const learner = await Learner.findOneAndUpdate(
      { _id: req.params.learnerId, teacherId: req.user!.teacherId },
      { $set: update },
      { new: true }
    ).lean();
    if (!learner) { res.status(404).json({ error: "Learner not found" }); return; }
    res.json(formatLearner(learner));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/learners/:learnerId/flag-aral
router.post("/:learnerId/flag-aral", async (req: AuthRequest, res: Response) => {
  try {
    if (!isObjectId(req.params.learnerId)) { res.status(400).json({ error: "Invalid learner ID" }); return; }
    const learner = await Learner.findOne({ _id: req.params.learnerId, teacherId: req.user!.teacherId });
    if (!learner) { res.status(404).json({ error: "Learner not found" }); return; }
    if (learner.isAral) {
      res.json(formatLearner(learner));
      return;
    }
    learner.isAral = true;
    learner.aralFlaggedAt = new Date();
    await learner.save();
    res.json(formatLearner(learner));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
