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
router.use(authorizeRoles("Admin"));

router.post("/create", createSubject);
router.get("/", getAllSubjects);
router.get("/:id", getSubjectById);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;
