import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authorization.js";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";

const router = express.Router();
router.use(isAuthenticated);

router.post("/create", authorizeRoles("Admin"), createSubject);
router.get("/", authorizeRoles("Admin", "Teacher"), getAllSubjects);
router.get("/:id", authorizeRoles("Admin", "Teacher"), getSubjectById);
router.put("/:id", authorizeRoles("Admin"), updateSubject);
router.delete("/:id", authorizeRoles("Admin"), deleteSubject);

export default router;
