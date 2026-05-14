import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authorization.js";
import {
  createNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
} from "../controllers/noticeController.js";

const router = express.Router();
router.use(isAuthenticated);

router.post("/", authorizeRoles("Admin"), createNotice);
router.get("/", getAllNotices);
router.get("/:id", getNoticeById);
router.put("/:id", authorizeRoles("Admin"), updateNotice);
router.delete("/:id", authorizeRoles("Admin"), deleteNotice);

export default router;
