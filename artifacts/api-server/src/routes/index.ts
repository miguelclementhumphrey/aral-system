import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import schoolHeadRouter from "./schoolHead";
import gradeLevelsRouter from "./gradeLevels";
import teachersRouter from "./teachers";
import learnersRouter from "./learners";
import aralRouter from "./aral";
import attendanceRouter from "./attendance";
import readingLevelsRouter from "./readingLevels";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/school-head", schoolHeadRouter);
router.use("/grade-levels", gradeLevelsRouter);
router.use("/teachers", teachersRouter);
router.use("/learners", learnersRouter);
router.use("/aral", aralRouter);
router.use("/attendance", attendanceRouter);
router.use("/reading-levels", readingLevelsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
