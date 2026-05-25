import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { School } from "../models/School";
import { Teacher } from "../models/Teacher";
import { Admin } from "../models/Admin";
import { GradeLevel } from "../models/GradeLevel";
import { signToken } from "../lib/jwt";
import { authenticate, AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /api/auth/schools - list active schools for login dropdown
router.get("/schools", async (req: Request, res: Response) => {
  try {
    const schools = await School.find({ status: "active" }).select("name status").lean();
    const teacherCounts = await Teacher.aggregate([
      { $group: { _id: "$schoolId", count: { $sum: 1 } } }
    ]);
    const countMap = new Map(teacherCounts.map((t) => [t._id.toString(), t.count]));
    const result = schools.map((s: any) => ({
      id: s._id.toString(),
      name: s.name,
      hasTeachers: (countMap.get(s._id.toString()) ?? 0) > 0,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/admin/login
router.post("/admin/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      res.status(401).json({ error: "Account locked. Try again later." });
      return;
    }
    const valid = await admin.comparePassword(password);
    if (!valid) {
      admin.failedAttempts += 1;
      if (admin.failedAttempts >= 5) {
        admin.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await admin.save();
      res.status(401).json({ error: `Invalid credentials. ${Math.max(0, 5 - admin.failedAttempts)} attempts remaining.` });
      return;
    }
    admin.failedAttempts = 0;
    admin.lockedUntil = undefined;
    await admin.save();
    const token = signToken({ id: admin._id.toString(), role: "super_admin" });
    res.json({
      token,
      user: { id: admin._id.toString(), role: "super_admin", name: "Super Admin" },
      requiresPasswordChange: false,
      profileComplete: true,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login - school head or teacher login
router.post("/login", async (req: Request, res: Response) => {
  const { schoolId, credential, role, teacherId } = req.body;
  if (!schoolId || !credential || !role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const school = await School.findById(schoolId);
    if (!school) {
      res.status(401).json({ error: "School not found. Contact your administrator." });
      return;
    }
    if (school.status !== "active") {
      res.status(401).json({ error: "This school account is not yet activated. Contact the system administrator." });
      return;
    }

    if (role === "school_head") {
      if (school.lockedUntil && school.lockedUntil > new Date()) {
        res.status(401).json({ error: "Too many failed attempts. Try again in 15 minutes." });
        return;
      }
      // First-time login: credential is the schoolCode
      if (school.isFirstLogin) {
        if (credential !== school.schoolCode) {
          school.failedAttempts += 1;
          if (school.failedAttempts >= 5) {
            school.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
          }
          await school.save();
          res.status(401).json({ error: `Incorrect credential. ${Math.max(0, 5 - school.failedAttempts)} attempts remaining.` });
          return;
        }
        school.failedAttempts = 0;
        school.lockedUntil = undefined;
        school.lastLoginAt = new Date();
        await school.save();
        const token = signToken({ id: school._id.toString(), role: "school_head", schoolId: school._id.toString() });
        res.json({
          token,
          user: { id: school._id.toString(), role: "school_head", name: school.schoolHeadName, schoolId: school._id.toString(), schoolName: school.name },
          requiresPasswordChange: true,
          profileComplete: school.profileComplete,
        });
        return;
      }
      // Returning login: credential is password
      const valid = await school.comparePassword(credential);
      if (!valid) {
        school.failedAttempts += 1;
        if (school.failedAttempts >= 5) {
          school.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        await school.save();
        res.status(401).json({ error: `Incorrect password. ${Math.max(0, 5 - school.failedAttempts)} attempts remaining.` });
        return;
      }
      school.failedAttempts = 0;
      school.lockedUntil = undefined;
      school.lastLoginAt = new Date();
      await school.save();
      const token = signToken({ id: school._id.toString(), role: "school_head", schoolId: school._id.toString() });
      res.json({
        token,
        user: { id: school._id.toString(), role: "school_head", name: school.schoolHeadName, schoolId: school._id.toString(), schoolName: school.name },
        requiresPasswordChange: false,
        profileComplete: school.profileComplete,
      });
      return;
    }

    if (role === "teacher") {
      if (!teacherId) {
        res.status(400).json({ error: "Teacher ID required" });
        return;
      }
      const teacher = await Teacher.findOne({ _id: teacherId, schoolId });
      if (!teacher) {
        res.status(401).json({ error: "Teacher not found." });
        return;
      }
      if (!teacher.isActive) {
        res.status(401).json({ error: "Account not yet activated by School Head." });
        return;
      }
      const valid = await teacher.comparePin(credential);
      if (!valid) {
        res.status(401).json({ error: "Incorrect PIN." });
        return;
      }
      const gradeLevel = await GradeLevel.findById(teacher.gradeLevelId);
      const token = signToken({ id: teacher._id.toString(), role: "teacher", schoolId: school._id.toString(), teacherId: teacher._id.toString() });
      res.json({
        token,
        user: {
          id: teacher._id.toString(),
          role: "teacher",
          name: `${teacher.firstName} ${teacher.lastName}`,
          schoolId: school._id.toString(),
          schoolName: school.name,
          gradeLevelId: teacher.gradeLevelId.toString(),
        },
        requiresPasswordChange: false,
        profileComplete: teacher.profileComplete,
      });
      return;
    }
    res.status(400).json({ error: "Invalid role" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/set-password
router.post("/set-password", async (req: Request, res: Response) => {
  const { schoolId, tempCredential, newPassword } = req.body;
  if (!schoolId || !tempCredential || !newPassword) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  if (newPassword.length < 8 || !/\d/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
    res.status(400).json({ error: "Password must be at least 8 characters with one number and one special character." });
    return;
  }
  try {
    const school = await School.findById(schoolId);
    if (!school || tempCredential !== school.schoolCode) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    school.passwordHash = await bcrypt.hash(newPassword, 12);
    school.isFirstLogin = false;
    school.lastLoginAt = new Date();
    await school.save();
    const token = signToken({ id: school._id.toString(), role: "school_head", schoolId: school._id.toString() });
    res.json({
      token,
      user: { id: school._id.toString(), role: "school_head", name: school.schoolHeadName, schoolId: school._id.toString(), schoolName: school.name },
      requiresPasswordChange: false,
      profileComplete: school.profileComplete,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === "super_admin") {
      res.json({ token: "", user: { id: user.id, role: "super_admin", name: "Super Admin" }, requiresPasswordChange: false, profileComplete: true });
      return;
    }
    if (user.role === "school_head") {
      const school = await School.findById(user.schoolId);
      if (!school) { res.status(404).json({ error: "School not found" }); return; }
      res.json({ token: "", user: { id: school._id.toString(), role: "school_head", name: school.schoolHeadName, schoolId: school._id.toString(), schoolName: school.name }, requiresPasswordChange: false, profileComplete: school.profileComplete });
      return;
    }
    if (user.role === "teacher") {
      const teacher = await Teacher.findById(user.teacherId);
      if (!teacher) { res.status(404).json({ error: "Teacher not found" }); return; }
      const school = await School.findById(user.schoolId);
      res.json({ token: "", user: { id: teacher._id.toString(), role: "teacher", name: `${teacher.firstName} ${teacher.lastName}`, schoolId: user.schoolId, schoolName: school?.name, gradeLevelId: teacher.gradeLevelId.toString() }, requiresPasswordChange: false, profileComplete: teacher.profileComplete });
      return;
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response) => {
  res.json({ success: true, message: "Logged out successfully" });
});

export default router;
