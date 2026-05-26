import { Router, Response } from "express";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import { Attendance } from "../models/Attendance";
import { Learner } from "../models/Learner";
import { Teacher } from "../models/Teacher";
import { isObjectId, pickFields } from "../lib/security";

const router = Router();
router.use(authenticate, requireRole("teacher"));

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 4);
  return d.toISOString().split("T")[0];
}

function countAbsences(record: any): number {
  return ["monday", "tuesday", "wednesday", "thursday", "friday"].filter((day) => record[day] === "absent").length;
}

async function formatAttendance(a: any): Promise<object> {
  const learner = await Learner.findById(a.learnerId).lean();
  return {
    id: a._id.toString(), learnerId: a.learnerId.toString(),
    learnerName: learner ? `${(learner as any).firstName} ${(learner as any).lastName}` : "",
    weekStartDate: a.weekStartDate, weekEndDate: a.weekEndDate || getWeekEnd(a.weekStartDate),
    monday: a.monday ?? null, tuesday: a.tuesday ?? null, wednesday: a.wednesday ?? null,
    thursday: a.thursday ?? null, friday: a.friday ?? null,
    totalAbsences: a.totalAbsences, isLocked: a.isLocked, createdAt: a.createdAt.toISOString(),
  };
}

// GET /api/attendance
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await Teacher.findById(req.user!.teacherId);
    if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
    const aralLearners = await Learner.find({ gradeLevelId: teacher.gradeLevelId, isAral: true }).select("_id").lean();
    const learnerIds = aralLearners.map((l: any) => l._id);
    const records = await Attendance.find({ learnerId: { $in: learnerIds } }).sort({ weekStartDate: -1 }).lean();
    const result = await Promise.all(records.map(formatAttendance));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/attendance
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { learnerId, weekStartDate, monday, tuesday, wednesday, thursday, friday } = req.body;
    if (!learnerId || !weekStartDate) {
      res.status(400).json({ error: "learnerId and weekStartDate are required" });
      return;
    }
    if (!isObjectId(learnerId)) { res.status(400).json({ error: "Invalid learner ID" }); return; }
    // Prevent future dates
    const now = new Date();
    const weekStart = new Date(weekStartDate);
    if (weekStart > now) {
      res.status(400).json({ error: "Cannot record attendance for future weeks." });
      return;
    }
    const teacher = await Teacher.findById(req.user!.teacherId);
    if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
    const learner = await Learner.findOne({ _id: learnerId, teacherId: req.user!.teacherId, isAral: true }).lean();
    if (!learner) { res.status(404).json({ error: "Learner not found" }); return; }
    const weekEndDate = getWeekEnd(weekStartDate);
    const attendanceFields = pickFields({ monday, tuesday, wednesday, thursday, friday }, ["monday", "tuesday", "wednesday", "thursday", "friday"] as const);
    const updates = { ...attendanceFields, weekEndDate, gradeLevelId: teacher.gradeLevelId, schoolId: req.user!.schoolId };
    const totalAbsences = countAbsences(updates);
    const record = await Attendance.findOneAndUpdate(
      { learnerId, weekStartDate },
      { ...updates, learnerId, totalAbsences, isLocked: false },
      { upsert: true, new: true }
    ).lean();
    res.json(await formatAttendance(record));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
