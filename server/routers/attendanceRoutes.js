import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authorization.js";
import {
  markStudentAttendance,
  markTeacherAttendance,
  getMyAttendance,
  getAllAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
} from "../controllers/attendanceController.js";

const router = express.Router();
router.use(isAuthenticated);

router.post("/createStd" ,authorizeRoles("Teacher") , markStudentAttendance);
router.post("/create", authorizeRoles("Admin"), markTeacherAttendance);
router.get("/my", authorizeRoles("Student", "Teacher"), getMyAttendance);
router.get("/", authorizeRoles("Admin", "Teacher"), getAllAttendances);
router.get("/:id", authorizeRoles("Admin", "Teacher", "Student"), getAttendanceById);
router.put("/:id", authorizeRoles("Admin", "Teacher"), updateAttendance);
router.delete("/:id", authorizeRoles("Admin", "Teacher"), deleteAttendance);

export default router;
