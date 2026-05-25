import { Router, Response } from "express";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import { Learner } from "../models/Learner";
import { AralAdditionalProfile } from "../models/AralAdditionalProfile";
import { Attendance } from "../models/Attendance";
import { ReadingLevel } from "../models/ReadingLevel";
import { Teacher } from "../models/Teacher";
import { GradeLevel } from "../models/GradeLevel";

const router = Router();
router.use(authenticate, requireRole("teacher", "school_head"));

// GET /api/aral/dashboard
router.get("/dashboard", async (req: AuthRequest, res: Response) => {
  try {
    let gradeLevelId: string | undefined;
    if (req.user!.role === "teacher") {
      const teacher = await Teacher.findById(req.user!.teacherId);
      if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
      gradeLevelId = teacher.gradeLevelId.toString();
    } else {
      gradeLevelId = req.query.gradeLevelId as string;
    }
    if (!gradeLevelId) { res.status(400).json({ error: "Grade level required" }); return; }
    const gradeLevel = await GradeLevel.findById(gradeLevelId).lean();
    if (!gradeLevel) { res.status(404).json({ error: "Grade level not found" }); return; }
    const aralLearners = await Learner.find({ gradeLevelId, isAral: true }).sort({ aralFlaggedAt: 1 }).lean();
    const learners = await Promise.all(aralLearners.map(async (l: any) => {
      const additionalProfile = await AralAdditionalProfile.findOne({ learnerId: l._id }).lean();
      const latestReadingLevel = await ReadingLevel.findOne({ learnerId: l._id }).sort({ year: -1, month: -1 }).lean();
      // Check consecutive absences
      const recentAttendance = await Attendance.find({ learnerId: l._id }).sort({ weekStartDate: -1 }).limit(3).lean();
      let consecutiveAbsences = 0;
      for (const att of recentAttendance) {
        const days = [att.monday, att.tuesday, att.wednesday, att.thursday, att.friday];
        const absences = days.filter((d) => d === "absent").length;
        consecutiveAbsences += absences;
      }
      return {
        id: l._id.toString(),
        name: `${l.firstName} ${l.lastName}`,
        lrn: l.lrn,
        aralFlaggedAt: l.aralFlaggedAt?.toISOString() ?? new Date().toISOString(),
        additionalProfileComplete: additionalProfile?.isComplete ?? false,
        lastUpdatedAt: additionalProfile ? (additionalProfile as any).updatedAt?.toISOString() ?? null : null,
        currentReadingLevel: (latestReadingLevel as any)?.readingLevel ?? null,
        consecutiveAbsences,
      };
    }));
    res.json({
      gradeLevelId: (gradeLevel as any)._id.toString(),
      gradeLevelName: gradeLevel.name,
      totalAralLearners: learners.length,
      learners,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/aral/learners/:learnerId/additional-profile
router.get("/learners/:learnerId/additional-profile", async (req: AuthRequest, res: Response) => {
  try {
    const profile = await AralAdditionalProfile.findOne({ learnerId: req.params.learnerId }).lean();
    if (!profile) {
      res.json({
        id: "", learnerId: req.params.learnerId, frequencyOfAbsenteeism: null,
        interventions: [], recommendedAssessment: null, otherObservations: null, isComplete: false, updatedAt: null,
      });
      return;
    }
    res.json({
      id: (profile as any)._id.toString(), learnerId: (profile as any).learnerId.toString(),
      frequencyOfAbsenteeism: profile.frequencyOfAbsenteeism ?? null,
      interventions: profile.interventions, recommendedAssessment: profile.recommendedAssessment ?? null,
      otherObservations: profile.otherObservations ?? null, isComplete: profile.isComplete,
      updatedAt: (profile as any).updatedAt?.toISOString() ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/aral/learners/:learnerId/additional-profile
router.post("/learners/:learnerId/additional-profile", async (req: AuthRequest, res: Response) => {
  try {
    const { frequencyOfAbsenteeism, interventions, recommendedAssessment, otherObservations } = req.body;
    const isComplete = !!(frequencyOfAbsenteeism && interventions?.length > 0);
    const profile = await AralAdditionalProfile.findOneAndUpdate(
      { learnerId: req.params.learnerId },
      { learnerId: req.params.learnerId, frequencyOfAbsenteeism, interventions: interventions || [], recommendedAssessment, otherObservations, isComplete },
      { upsert: true, new: true }
    ).lean();
    res.json({
      id: (profile as any)._id.toString(), learnerId: (profile as any).learnerId.toString(),
      frequencyOfAbsenteeism: profile.frequencyOfAbsenteeism ?? null,
      interventions: profile.interventions, recommendedAssessment: profile.recommendedAssessment ?? null,
      otherObservations: profile.otherObservations ?? null, isComplete: profile.isComplete,
      updatedAt: (profile as any).updatedAt?.toISOString() ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
