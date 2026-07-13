import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authorization.js";
import {
  createAssigment,
  getAllAssigments,
  getAssigmentById,
  updateAssigmentStatus,
  deleteAssigment,
} from "../controllers/assigmentController.js";

const router = express.Router();

router.use(isAuthenticated);

router.post("/", authorizeRoles("Teacher"), createAssigment);
router.post("/create", authorizeRoles("Teacher"), createAssigment);
router.get("/", authorizeRoles("Teacher", "Student"), getAllAssigments);
router.put("/:id/status", authorizeRoles("Teacher"), updateAssigmentStatus);
router.put("/:id", authorizeRoles("Teacher"), updateAssigmentStatus);
router.get("/:id", getAssigmentById);
router.delete("/:id", authorizeRoles("Teacher"), deleteAssigment);

export default router;