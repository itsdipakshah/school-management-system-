import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authorization.js";
import {
  registerTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} from "../controllers/teacherController.js";

const router = express.Router();
router.use(isAuthenticated);
router.use(authorizeRoles("Admin","Teacher"));

router.post("/register",authorizeRoles("Admin"), registerTeacher);
router.get("/", getAllTeachers);
router.get("/:id", authorizeRoles("Teacher","Admin"), getTeacherById);
router.put("/:id", updateTeacher);
router.delete("/:id", deleteTeacher);

export default router;
