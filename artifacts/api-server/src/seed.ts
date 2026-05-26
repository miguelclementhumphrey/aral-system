import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { Admin } from "./models/Admin";
import { AralAdditionalProfile } from "./models/AralAdditionalProfile";
import { Attendance } from "./models/Attendance";
import { GradeLevel } from "./models/GradeLevel";
import { Learner } from "./models/Learner";
import { ReadingLevel } from "./models/ReadingLevel";
import { School } from "./models/School";
import { SchoolHeadProfile } from "./models/SchoolHeadProfile";
import { Teacher } from "./models/Teacher";
import { TeacherProfile } from "./models/TeacherProfile";
import { logger } from "./lib/logger";

export async function seedAdmin() {
  try {
    const username = process.env.ADMIN_USERNAME?.trim();
    const password = process.env.ADMIN_PASSWORD?.trim();

    if (!username || !password) {
      logger.warn("ADMIN_USERNAME or ADMIN_PASSWORD not set. Skipping initial super admin seed.");
    } else if (password.length < 10) {
      throw new Error("ADMIN_PASSWORD must be at least 10 characters long.");
    } else {
      const existing = await Admin.findOne({ username });
      if (!existing) {
        const passwordHash = await bcrypt.hash(password, 12);
        await Admin.create({ username, passwordHash });
        logger.info({ username }, "Super admin seeded");
      } else if (process.env.ADMIN_UPDATE_PASSWORD_ON_START === "true") {
        existing.passwordHash = await bcrypt.hash(password, 12);
        existing.failedAttempts = 0;
        existing.lockedUntil = undefined;
        await existing.save();
        logger.warn({ username }, "Super admin password updated from ADMIN_PASSWORD");
      }
    }

    if (process.env.SEED_DEMO_DATA === "true") {
      await seedDemoData();
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed admin");
    throw err;
  }
}

async function seedDemoData() {
  const schoolPassword = process.env.DEMO_SCHOOL_PASSWORD?.trim() || generateSecret("school");
  const teacherPin = process.env.DEMO_TEACHER_PIN?.trim() || generatePin();

  const school = await School.findOneAndUpdate(
    { schoolCode: "ARAL-DEMO" },
    {
      $set: {
        name: "ARAL Demo Elementary School",
        division: "Demo Division",
        district: "Demo District",
        region: "Region IV-A",
        schoolHeadName: "Maria Santos",
        schoolHeadContact: "09171234567",
        status: "active",
        passwordHash: await bcrypt.hash(schoolPassword, 12),
        isFirstLogin: false,
        failedAttempts: 0,
        lockedUntil: undefined,
        profileComplete: true,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  await SchoolHeadProfile.findOneAndUpdate(
    { schoolId: school._id },
    {
      $set: {
        schoolId: school._id,
        firstName: "Maria",
        middleName: "R.",
        lastName: "Santos",
        designation: "School Head",
        position: "Principal I",
        contactNumber: "09171234567",
        email: "maria.santos@example.com",
        district: "Demo District",
        division: "Demo Division",
        schoolYear: "2026-2027",
        highestEducationalAttainment: "Master's Degree",
        yearsInService: "12",
        fieldOfSpecialization: "Educational Management",
        trainingsAttended: ["School Leadership", "Reading Intervention Planning"],
        isComplete: true,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  const gradeLevel = await GradeLevel.findOneAndUpdate(
    { schoolId: school._id, name: "Grade 3 - Sampaguita" },
    {
      $set: {
        schoolId: school._id,
        name: "Grade 3 - Sampaguita",
        isActive: true,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  const teacher = await Teacher.findOneAndUpdate(
    { schoolId: school._id, gradeLevelId: gradeLevel._id, firstName: "Juan", lastName: "Dela Cruz" },
    {
      $set: {
        schoolId: school._id,
        gradeLevelId: gradeLevel._id,
        firstName: "Juan",
        middleName: "M.",
        lastName: "Dela Cruz",
        pin: teacherPin,
        pinHash: await bcrypt.hash(teacherPin, 10),
        isActive: true,
        profileComplete: true,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  await TeacherProfile.findOneAndUpdate(
    { teacherId: teacher._id },
    {
      $set: {
        teacherId: teacher._id,
        age: 34,
        sex: "Male",
        dateOfBirth: "1992-04-15",
        yearsInService: "8",
        highestEducationalAttainment: "Bachelor's Degree",
        fieldOfSpecialization: "Elementary Education",
        currentGradeLevel: "Grade 3",
        contactNumber: "09179876543",
        mostSubjectHandled: "Reading",
        trainingsAttended: ["Beginning Reading", "ARAL Intervention"],
        isComplete: true,
      },
    },
    { upsert: true, returnDocument: 'after' },
  );

  const learners = [
    {
      firstName: "Ana",
      middleName: "L.",
      lastName: "Reyes",
      lrn: "100000000001",
      sex: "Female",
      isAral: true,
      readingLevelEnglish: "Frustration",
      readingLevelFilipino: "Instructional",
    },
    {
      firstName: "Ben",
      middleName: "C.",
      lastName: "Garcia",
      lrn: "100000000002",
      sex: "Male",
      isAral: false,
      readingLevelEnglish: "Independent",
      readingLevelFilipino: "Independent",
    },
    {
      firstName: "Lia",
      middleName: "P.",
      lastName: "Mendoza",
      lrn: "100000000003",
      sex: "Female",
      isAral: true,
      readingLevelEnglish: "Instructional",
      readingLevelFilipino: "Frustration",
    },
  ];

  for (const learnerData of learners) {
    const learner = await Learner.findOneAndUpdate(
      { lrn: learnerData.lrn },
      {
        $set: {
          schoolId: school._id,
          gradeLevelId: gradeLevel._id,
          teacherId: teacher._id,
          firstName: learnerData.firstName,
          middleName: learnerData.middleName,
          lastName: learnerData.lastName,
          lrn: learnerData.lrn,
          dateOfBirth: "2017-06-12",
          sex: learnerData.sex,
          guardianName: "Demo Guardian",
          guardianContact: "09170000000",
          address: "Demo Barangay, Demo City",
          isAral: learnerData.isAral,
          aralFlaggedAt: learnerData.isAral ? new Date() : undefined,
          profileComplete: true,
          readingLevelEnglish: learnerData.readingLevelEnglish,
          readingLevelFilipino: learnerData.readingLevelFilipino,
          governmentBenefits: ["None"],
          parentsEducation: "High School Graduate",
          modeOfTransportation: "Walking",
          distanceFromSchool: "1 km",
          previousTransfers: "None",
          letterRecognition: "Developing",
          letterSoundCorrespondence: "Developing",
          wordRecognition: "Developing",
          homeLiteracyEnvironment: "Has reading materials at home",
          parentalSupport: "Moderate",
          classroomLearningEnvironment: "Needs guided reading support",
          languageConsiderations: "Filipino and English",
          suggestedInterventions: learnerData.isAral ? ["Guided reading", "Parent-supported reading practice"] : [],
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    if (learnerData.isAral) {
      await AralAdditionalProfile.findOneAndUpdate(
        { learnerId: learner._id },
        {
          $set: {
            learnerId: learner._id,
            frequencyOfAbsenteeism: "Occasional",
            interventions: ["Guided oral reading", "Vocabulary practice"],
            recommendedAssessment: "Monthly reading level check",
            otherObservations: "Needs confidence-building activities.",
            isComplete: true,
          },
        },
        { upsert: true, returnDocument: 'after' },
      );

      const now = new Date();
      await ReadingLevel.findOneAndUpdate(
        { learnerId: learner._id, month: now.getMonth() + 1, year: now.getFullYear(), language: "english" },
        {
          $set: {
            learnerId: learner._id,
            gradeLevelId: gradeLevel._id,
            schoolId: school._id,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            readingLevel: learnerData.readingLevelEnglish,
            language: "english",
            notes: "Seeded baseline assessment.",
          },
        },
        { upsert: true, returnDocument: 'after' },
      );

      await Attendance.findOneAndUpdate(
        { learnerId: learner._id, weekStartDate: "2026-05-25" },
        {
          $set: {
            learnerId: learner._id,
            gradeLevelId: gradeLevel._id,
            schoolId: school._id,
            weekStartDate: "2026-05-25",
            weekEndDate: "2026-05-29",
            monday: "present",
            tuesday: "present",
            wednesday: "absent",
            thursday: "present",
            friday: "late",
            totalAbsences: 1,
            isLocked: false,
          },
        },
        { upsert: true, returnDocument: 'after' },
      );
    }
  }

  logger.info(
    {
      school: school.name,
      schoolHeadLogin: { school: school.name, password: schoolPassword },
      teacherLogin: { school: school.name, pin: teacherPin },
    },
    "Demo school data seeded",
  );
}

function generatePin(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function generateSecret(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(12).toString("base64url")}`;
}
