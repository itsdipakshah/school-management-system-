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
router.use(authorizeRoles("Admin"));

router.post("/create", createClass);
router.get("/all", getAllClasses);
router.get("/:id", getClassById);
router.put("/:id", updateClass);
router.delete("/:id", deleteClass);

export default router;
