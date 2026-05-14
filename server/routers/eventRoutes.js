import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/authorization.js";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";

const router = express.Router();
router.use(isAuthenticated);

router.post("/", authorizeRoles("Admin"), createEvent);
router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.put("/:id", authorizeRoles("Admin"), updateEvent);
router.delete("/:id", authorizeRoles("Admin"), deleteEvent);

export default router;
