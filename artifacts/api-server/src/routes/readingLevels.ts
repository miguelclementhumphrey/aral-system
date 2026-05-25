import { Router, Response } from "express";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import { ReadingLevel } from "../models/ReadingLevel";
import { Learner } from "../models/Learner";
import { Teacher } from "../models/Teacher";

const router = Router();
router.use(authenticate, requireRole("teacher"));

async function formatRecord(r: any): Promise<object> {
  const learner = await Learner.findById(r.learnerId).lean();
  return {
    id: r._id.toString(), learnerId: r.learnerId.toString(),
    learnerName: learner ? `${(learner as any).firstName} ${(learner as any).lastName}` : "",
    month: r.month, year: r.year, readingLevel: r.readingLevel, language: r.language,
    notes: r.notes ?? null, createdAt: r.createdAt.toISOString(),
  };
}

// GET /api/reading-levels
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await Teacher.findById(req.user!.teacherId);
    if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
    const aralLearners = await Learner.find({ gradeLevelId: teacher.gradeLevelId, isAral: true }).select("_id").lean();
    const learnerIds = aralLearners.map((l: any) => l._id);
    const records = await ReadingLevel.find({ learnerId: { $in: learnerIds } }).sort({ year: -1, month: -1 }).lean();
    const result = await Promise.all(records.map(formatRecord));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/reading-levels
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { learnerId, month, year, readingLevel, language, notes } = req.body;
    if (!learnerId || !month || !year || !readingLevel || !language) {
      res.status(400).json({ error: "Required fields missing." });
      return;
    }
    const teacher = await Teacher.findById(req.user!.teacherId);
    if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
    const existing = await ReadingLevel.findOne({ learnerId, month, year, language });
    if (existing) {
      res.status(409).json({ error: "A reading level entry already exists for this learner this month. Edit the existing record instead." });
      return;
    }
    const record = await ReadingLevel.create({
      learnerId, month, year, readingLevel, language, notes,
      gradeLevelId: teacher.gradeLevelId, schoolId: req.user!.schoolId,
    });
    res.json(await formatRecord(record));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/reading-levels/:recordId
router.patch("/:recordId", async (req: AuthRequest, res: Response) => {
  try {
    const record = await ReadingLevel.findByIdAndUpdate(req.params.recordId, { $set: req.body }, { new: true }).lean();
    if (!record) { res.status(404).json({ error: "Record not found" }); return; }
    res.json(await formatRecord(record));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
