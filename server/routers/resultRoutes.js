import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authorization.js";
import {
  addResult,
  getAllResults,
  getResultById,
  updateResult,
  deleteResult,
  getResultsByClassAndSubject,
} from "../controllers/resultController.js";

const router = express.Router();
router.use(isAuthenticated);

router.post("/add", authorizeRoles("Admin", "Teacher"), addResult);
router.get("/", authorizeRoles("Admin", "Teacher", "Student"), getAllResults);
router.get("/:id", authorizeRoles("Admin", "Teacher", "Student"), getResultById);
router.put("/:id", authorizeRoles("Admin", "Teacher"), updateResult);
router.delete("/:id", authorizeRoles("Admin", "Teacher"), deleteResult);
router.get("/class/:classId/subject/:subjectId", authorizeRoles("Admin", "Teacher"), getResultsByClassAndSubject);

export default router;
