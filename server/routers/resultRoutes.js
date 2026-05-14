import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authorization.js";
import {
  addResult,
  getAllResults,
  getResultById,
  updateResult,
  deleteResult,
} from "../controllers/resultController.js";

const router = express.Router();
router.use(isAuthenticated);

router.post("/", authorizeRoles("Admin", "Teacher"), addResult);
router.get("/", authorizeRoles("Admin", "Teacher", "Student"), getAllResults);
router.get("/:id", authorizeRoles("Admin", "Teacher", "Student"), getResultById);
router.put("/:id", authorizeRoles("Admin", "Teacher"), updateResult);
router.delete("/:id", authorizeRoles("Admin", "Teacher"), deleteResult);

export default router;
