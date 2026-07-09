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

router.post("/create", authorizeRoles("Teacher"), createAssigment);
router.get("/", authorizeRoles("Teacher", "Student"), getAllAssigments);
router.get("/:id", getAssigmentById);
router.put("/:id/status", authorizeRoles("Teacher"), updateAssigmentStatus);
router.delete("/:id", authorizeRoles("Teacher"), deleteAssigment);


export default router;