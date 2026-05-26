import { Router, Response } from "express";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import { GradeLevel } from "../models/GradeLevel";
import { Teacher } from "../models/Teacher";
import { Learner } from "../models/Learner";
import { School } from "../models/School";
import { SchoolHeadProfile } from "../models/SchoolHeadProfile";
import { isObjectId } from "../lib/security";

const router = Router();
router.use(authenticate, requireRole("school_head"));

// GET /api/grade-levels
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId!;
    const gradeLevels = await GradeLevel.find({ schoolId }).sort({ createdAt: 1 }).lean();
    const result = await Promise.all(gradeLevels.map(async (gl: any) => {
      const [teachersCount, learnersCount, aralLearnersCount] = await Promise.all([
        Teacher.countDocuments({ gradeLevelId: gl._id }),
        Learner.countDocuments({ gradeLevelId: gl._id }),
        Learner.countDocuments({ gradeLevelId: gl._id, isAral: true }),
      ]);
      return {
        id: gl._id.toString(), schoolId: gl.schoolId.toString(), name: gl.name,
        teachersCount, learnersCount, aralLearnersCount, createdAt: gl.createdAt.toISOString(),
      };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/grade-levels
router.post("/", async (req: AuthRequest, res: Response) => {
  const schoolId = req.user!.schoolId!;
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: "Grade level name required" }); return; }
  try {
    const profile = await SchoolHeadProfile.findOne({ schoolId });
    if (!profile || !profile.isComplete) {
      res.status(403).json({ error: "Complete your profile before creating grade levels." });
      return;
    }
    const existing = await GradeLevel.findOne({ schoolId, name });
    if (existing) { res.status(409).json({ error: `Grade level "${name}" already exists.` }); return; }
    const gl = await GradeLevel.create({ schoolId, name });
    res.status(201).json({
      id: gl._id.toString(), schoolId: gl.schoolId.toString(), name: gl.name,
      teachersCount: 0, learnersCount: 0, aralLearnersCount: 0, createdAt: gl.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/grade-levels/:gradeLevelId
router.get("/:gradeLevelId", async (req: AuthRequest, res: Response) => {
  try {
    if (!isObjectId(req.params.gradeLevelId)) { res.status(400).json({ error: "Invalid grade level ID" }); return; }
    const gl = await GradeLevel.findOne({ _id: req.params.gradeLevelId, schoolId: req.user!.schoolId }).lean();
    if (!gl) { res.status(404).json({ error: "Grade level not found" }); return; }
    const [teachersCount, learnersCount, aralLearnersCount] = await Promise.all([
      Teacher.countDocuments({ gradeLevelId: gl._id }),
      Learner.countDocuments({ gradeLevelId: gl._id }),
      Learner.countDocuments({ gradeLevelId: gl._id, isAral: true }),
    ]);
    res.json({
      id: (gl as any)._id.toString(), schoolId: (gl as any).schoolId.toString(), name: gl.name,
      teachersCount, learnersCount, aralLearnersCount, createdAt: (gl as any).createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
