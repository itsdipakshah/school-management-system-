import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authorization.js";
import {
  createFee,
  getAllFees,
  getFeeById,
  updateFee,
  deleteFee,
} from "../controllers/feeController.js";

const router = express.Router();
router.use(isAuthenticated);
router.use(authorizeRoles("Admin"));

router.post("/", createFee);
router.get("/", getAllFees);
router.get("/:id", getFeeById);
router.put("/:id", updateFee);
router.delete("/:id", deleteFee);

export default router;
