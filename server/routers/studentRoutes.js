import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authorization.js";
import {
  registerStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentsByClass,
} from "../controllers/studentController.js";

const router = express.Router();
router.use(isAuthenticated);
// router.use(authorizeRoles("Admin"));

router.post("/register", registerStudent);
router.get("/", getAllStudents);
router.get("/class/:sclassName", getStudentsByClass);
router.get("/:id", authorizeRoles("Student","Admin","Teacher"), getStudentById);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

export default router;
