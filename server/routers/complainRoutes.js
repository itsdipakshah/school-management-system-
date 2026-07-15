import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authorization.js";
import {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
} from "../controllers/complainController.js";

const router = express.Router();
router.use(isAuthenticated);

router.post("/create", createComplaint);
router.get("/", authorizeRoles("Admin"), getAllComplaints);
router.get("/:id", getComplaintById);
router.put("/:id/status", authorizeRoles("Admin"), updateComplaintStatus);
router.delete("/:id", authorizeRoles("Admin"), deleteComplaint);

export default router;
