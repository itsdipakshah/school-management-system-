import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import Student from "../models/studentModel.js";
import User from "../models/userModel.js";
import { generateToken } from "../utils/generateToken.js";

// Register Student
// Note: This is for admin to create student accounts. Students will not register themselves.
export const registerStudent = asyncHandler(async (req, res, next) => {
     if(!req.files || Object.keys(req.files).length===0){
            return next(new ErrorHandler("Avatar is required..",400));
        }
        const {studentAvatar} = req.files; 
       
        
        //cloudinaryResponseForAvatar(crfa)
        const cloudinaryResponseForAvatar = await cloudinary.uploader.upload(
            studentAvatar.tempFilePath,
            {folder:"AVATAR"}
        );
      if(!cloudinaryResponseForAvatar || cloudinaryResponseForAvatar.error){
    return next(new ErrorHandler("Avatar upload failed", 500));
}

const { firstName, lastName, email, dob , rollNum, password, phone, address, schoolName, sclassName } = req.body;

if (!firstName || !lastName || !email || !dob || !rollNum || !password || !phone || !address || !schoolName || !sclassName ) {
    return next(new ErrorHandler("All fields are required", 400));
};



});