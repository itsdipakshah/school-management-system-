import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import User from "../models/userModel.js";
import {generateToken } from "../utils/generateToken.js";



//Register User
export const registerUser = asyncHandler(async(req,res,next)=>{
    const {name,email,password,role} = req.body;
    if(!name || !email || !password || !role){
        return next(new ErrorHandler("Please fill all fields", 400));
    }
    
    let user = await User.findOne({email});
    if (user) {
        return next(new ErrorHandler("User already exists", 400));
    };

    user = new User({name,email,password,role});
    await user.save();

    res.status(201).json({
        success:true,
        message:"User registered successfully",
    }); 
   return generateToken(user,201,"User registered successfully",res);
});
//Login User
export const loginUser = asyncHandler(async(req,res,next)=>{

});
//Logout User
export const logoutUser = asyncHandler(async(req,res,next)=>{

});
//Forgot Password
export const forgotPassword = asyncHandler(async(req,res,next)=>{

});
//Reset Password
export const resetPassword = asyncHandler(async(req,res,next)=>{

});
//update Password
export const updatePassword = asyncHandler(async(req,res,next)=>{

});
//Get User Details
export const getUser = asyncHandler(async(req,res,next)=>{

});
