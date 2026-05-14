import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authorization.js";
import { getStudentDashboard, getTeacherDashboard } from "../controllers/dashboardController.js";

const router = express.Router();
router.use(isAuthenticated);

router.get("/student", authorizeRoles("Student"), getStudentDashboard);
router.get("/teacher", authorizeRoles("Teacher"), getTeacherDashboard);

export default router;
