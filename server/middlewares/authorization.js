import jwt from "jsonwebtoken";
import {asyncHandler} from "./asyncHandler.js";
import ErrorHandler from "./error.js";
import User from "../models/userModel.js";

export const isAuthenticated = asyncHandler(async(req,res,next)=>{
    const token = req.cookies?.token || req.body?.token;
    if(!token){
        return next(new ErrorHandler("Please login to access this resource",401));
    }

    const decoded= jwt.verify(token ,process.env.JWT_SECRET);
    req.user= await User.findById(decoded.id).select("-resetPasswordToken -resetPasswordExpire");
   
    if (!req.user) {
        return next(new ErrorHandler("User not found", 404));
    }

    next();
});

export const isAdmin = asyncHandler(async (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return next(new ErrorHandler("Access denied. Admins only.", 403));
    }
    next();
});