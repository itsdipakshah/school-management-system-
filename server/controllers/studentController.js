import cloudinary from "cloudinary";
import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import Student from "../models/studentModel.js";
import User from "../models/userModel.js";
import Sclass from "../models/sclassModel.js";

export const registerStudent = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    dob,
    rollNum,
    password,
    phone,
    address,
    schoolName,
    sclassName,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !dob ||
    !rollNum ||
    !password ||
    !phone ||
    !address ||
    !schoolName ||
    !sclassName
  ) {
    return next(new ErrorHandler("All student fields are required", 400));
  }

  const existingUser = await User.findOne({ email });
  const existingStudent = await Student.findOne({ email });
  if (existingUser || existingStudent) {
    return next(new ErrorHandler("A student with this email already exists", 400));
  }

  if (!req.files?.studentAvatar) {
    return next(new ErrorHandler("Student avatar is required", 400));
  }

  const studentAvatar = req.files.studentAvatar;
  const uploadResult = await cloudinary.v2.uploader.upload(studentAvatar.tempFilePath, {
    folder: "StudentAvatars",
  });

  if (!uploadResult?.secure_url) {
    return next(new ErrorHandler("Avatar upload failed", 500));
  }

  const user = await User.create({
    name: `${firstName} ${lastName}`,
    email,
    password,
    role: "Student",
  });

  const student = await Student.create({
    user: user._id,
    firstName,
    lastName,
    email,
    dob,
    rollNum,
    password: user.password,
    phone,
    address,
    schoolName,
    sclassName,
    role: "Student",
    studentAvatar: {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    },
  });

  res.status(201).json({
    success: true,
    student,
  });
});

export const getAllStudents = asyncHandler(async (req, res) => {
  const students = await Student.find().select(
    "firstName lastName email rollNum phone address studentAvatar sclassName schoolName user"
  );
  res.status(200).json({
    success: true,
    students,
  });
});

export const getStudentById = asyncHandler(async (req, res, next) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  res.status(200).json({
    success: true,
    student,
  });
});

export const getStudentsByClass = asyncHandler(async (req, res) => {
  
  const studentByClass = await Student.find({ sclassName: req.params.sclassName }).select(
    "name firstName lastName email rollNum sclassName schoolName user"
  );
   res.status(200).json({
    success: true,
    studentByClass,
  });

});


export const updateStudent = asyncHandler(async (req, res, next) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  const { email, password, firstName, lastName, phone, address, schoolName, sclassName } = req.body;

  if (email && email !== student.email) {
    const emailInUse = await Student.findOne({ email });
    if (emailInUse) {
      return next(new ErrorHandler("Email already in use", 400));
    }
    student.email = email;
    if (student.user) {
      const existingUser = await User.findById(student.user).select("+password");
      if (existingUser) {
        existingUser.email = email;
        await existingUser.save();
      }
    }
  }

  if (password && student.user) {
    const existingUser = await User.findById(student.user).select("+password");
    if (existingUser) {
      existingUser.password = password;
      await existingUser.save();
      student.password = existingUser.password;
    }
  }

  if (firstName) student.firstName = firstName;
  if (lastName) student.lastName = lastName;
  if (phone) student.phone = phone;
  if (address) student.address = address;
  if (schoolName) student.schoolName = schoolName;
  if (sclassName) student.sclassName = sclassName;

  if (req.files?.studentAvatar) {
    const uploadResult = await cloudinary.v2.uploader.upload(
      req.files.studentAvatar.tempFilePath,
      { folder: "StudentAvatars" }
    );
    if (!uploadResult?.secure_url) {
      return next(new ErrorHandler("Avatar upload failed", 500));
    }
    student.studentAvatar = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  await student.save();

  res.status(200).json({
    success: true,
    student,
  });
});

export const deleteStudent = asyncHandler(async (req, res, next) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return next(new ErrorHandler("Student not found", 404));
  }

  if (student.user) {
    await User.findByIdAndDelete(student.user);
  }

  await student.deleteOne();

  res.status(200).json({
    success: true,
    message: "Student deleted successfully",
  });
});