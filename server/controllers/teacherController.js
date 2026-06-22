import cloudinary from "cloudinary";
import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import Teacher from "../models/teacherModel.js";
import User from "../models/userModel.js";

export const registerTeacher = asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    password,
    school,
    teachSubject,
    teachSclass,
    salary,
  } = req.body;

  if (!name || !email || !phone || !password || !school || !teachSclass) {
    return next(new ErrorHandler("All teacher fields are required", 400));
  }

  const existingUser = await User.findOne({ email });
  const existingTeacher = await Teacher.findOne({ email });
  if (existingUser || existingTeacher) {
    return next(new ErrorHandler("A teacher with this email already exists", 400));
  }

  if (!req.files?.teacherAvatar) {
    return next(new ErrorHandler("Teacher avatar is required", 400));
  }

  const teacherAvatar = req.files.teacherAvatar;
  const uploadResult = await cloudinary.v2.uploader.upload(teacherAvatar.tempFilePath, {
    folder: "TeacherAvatars",
  });

  if (!uploadResult?.secure_url) {
    return next(new ErrorHandler("Teacher avatar upload failed", 500));
  }

  const user = await User.create({
    name,
    email,
    password,
    role: "Teacher",
  });

  const teacher = await Teacher.create({
    user: user._id,
    name,
    email,
    phone,
    password: user.password,
    role: "Teacher",
    school,
    teachSubject,
    teachSclass,
    salary,
    teacherAvatar: {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    },
  });

  res.status(201).json({
    success: true,
    teacher,
  });
});

export const getAllTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find().select(
    "name email phone school teachSubject teacherAvatar teachSclass salary"
  );

  res.status(200).json({
    success: true,
    teachers,
  });
});

export const getTeacherById = asyncHandler(async (req, res, next) => {
  const teacher = await Teacher.findById(req.params.id).populate('user');
  if (!teacher) {
    return next(new ErrorHandler("Teacher not found", 404));
  }

  res.status(200).json({
    success: true,
    teacher,
  });
});

export const updateTeacher = asyncHandler(async (req, res, next) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return next(new ErrorHandler("Teacher not found", 404));
  }

  const { email, password, name, phone, school, teachSubject, teachSclass, salary } = req.body;

  if (email && email !== teacher.email) {
    const emailInUse = await Teacher.findOne({ email });
    if (emailInUse) {
      return next(new ErrorHandler("Email already in use", 400));
    }
    teacher.email = email;
    if (teacher.user) {
      const existingUser = await User.findById(teacher.user).select("+password");
      if (existingUser) {
        existingUser.email = email;
        await existingUser.save();
      }
    }
  }

  if (password && teacher.user) {
    const existingUser = await User.findById(teacher.user).select("+password");
    if (existingUser) {
      existingUser.password = password;
      await existingUser.save();
      teacher.password = existingUser.password;
    }
  }

  if (name) teacher.name = name;
  if (phone) teacher.phone = phone;
  if (school) teacher.school = school;
  if (teachSubject) teacher.teachSubject = teachSubject;
  if (teachSclass) teacher.teachSclass = teachSclass;
  if (salary !== undefined) teacher.salary = salary;

  if (req.files?.teacherAvatar) {
    const uploadResult = await cloudinary.v2.uploader.upload(
      req.files.teacherAvatar.tempFilePath,
      { folder: "TeacherAvatars" }
    );

    if (!uploadResult?.secure_url) {
      return next(new ErrorHandler("Teacher avatar upload failed", 500));
    }

    teacher.teacherAvatar = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  await teacher.save();

  res.status(200).json({
    success: true,
    teacher,
  });
});

export const deleteTeacher = asyncHandler(async (req, res, next) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return next(new ErrorHandler("Teacher not found", 404));
  }

  if (teacher.user) {
    await User.findByIdAndDelete(teacher.user);
  }

  await teacher.deleteOne();

  res.status(200).json({
    success: true,
    message: "Teacher deleted successfully",
  });
});