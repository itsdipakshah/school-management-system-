import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authorization.js";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
} from "../controllers/sclasseController.js";

const router = express.Router();
router.use(isAuthenticated);

router.post("/create", authorizeRoles("Admin"), createClass);
router.get("/all", authorizeRoles("Admin", "Teacher"), getAllClasses);
router.get("/:id", authorizeRoles("Admin", "Teacher"), getClassById);
router.put("/:id", authorizeRoles("Admin"), updateClass);
router.delete("/:id", authorizeRoles("Admin"), deleteClass);

export default router;
