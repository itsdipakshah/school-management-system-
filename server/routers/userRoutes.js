import express from "express";
import { registerUser, loginUser, logoutUser, forgotPassword, resetPassword ,getUser} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/authorization.js";


const router = express.Router();

router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/me",isAuthenticated ,getUser);
router.get("/logout",isAuthenticated ,logoutUser);
router.post("/password/forgot",forgotPassword);
router.put("/password/reset/:token",resetPassword);


export default router;