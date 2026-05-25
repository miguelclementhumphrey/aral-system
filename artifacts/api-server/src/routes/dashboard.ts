import { Router, Response } from "express";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import { GradeLevel } from "../models/GradeLevel";
import { Teacher } from "../models/Teacher";
import { Learner } from "../models/Learner";
import { ReadingLevel } from "../models/ReadingLevel";

const router = Router();
router.use(authenticate, requireRole("school_head"));

// GET /api/dashboard/summary
router.get("/summary", async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId!;
    const gradeLevels = await GradeLevel.find({ schoolId }).lean();
    const [totalTeachers, totalLearners, totalAralLearners] = await Promise.all([
      Teacher.countDocuments({ schoolId }),
      Learner.countDocuments({ schoolId }),
      Learner.countDocuments({ schoolId, isAral: true }),
    ]);
    const gradeLevelBreakdown = await Promise.all(gradeLevels.map(async (gl: any) => {
      const [total, aral] = await Promise.all([
        Learner.countDocuments({ gradeLevelId: gl._id }),
        Learner.countDocuments({ gradeLevelId: gl._id, isAral: true }),
      ]);
      return { name: gl.name, totalLearners: total, aralLearners: aral };
    }));
    // Reading level distribution from all ARAL learners
    const now = new Date();
    const aralLearners = await Learner.find({ schoolId, isAral: true }).select("_id").lean();
    const learnerIds = aralLearners.map((l: any) => l._id);
    const latestReadingLevels = await ReadingLevel.aggregate([
      { $match: { learnerId: { $in: learnerIds }, year: now.getFullYear() } },
      { $sort: { month: -1 } },
      { $group: { _id: { learnerId: "$learnerId", language: "$language" }, readingLevel: { $first: "$readingLevel" } } },
    ]);
    const levelCounts: Record<string, number> = {};
    for (const r of latestReadingLevels) {
      levelCounts[r.readingLevel] = (levelCounts[r.readingLevel] || 0) + 1;
    }
    const readingLevelDistribution = Object.entries(levelCounts).map(([level, count]) => ({ level, count }));
    res.json({
      totalGradeLevels: gradeLevels.length, totalTeachers, totalLearners, totalAralLearners,
      gradeLevelBreakdown, readingLevelDistribution,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
