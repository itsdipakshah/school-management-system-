import express from "express";
import { registerUser, loginUser, logoutUser, forgotPassword, resetPassword ,getUser ,updatePassword} from "../controllers/userController.js";


const router = express.Router();

router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/logout",logoutUser);
router.post("/password/forgot",forgotPassword);
router.put("/password/reset/:token",resetPassword);
router.get("/me",getUser);
router.put("/password/update",updatePassword);

export default router;