import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import Sclass from "../models/sclassModel.js";

export const createClass = asyncHandler(async (req, res, next) => {
  const { sclassName, school } = req.body;
  if (!sclassName) {
    return next(new ErrorHandler("Class name is required", 400));
  }

  const existingClass = await Sclass.findOne({ sclassName });
  if (existingClass) {
    return next(new ErrorHandler("Class already exists", 400));
  }

  const sclass = await Sclass.create({
    sclassName,
    school: school || req.user.schoolName || undefined,
  });

  res.status(201).json({ success: true, sclass });
});

export const getAllClasses = asyncHandler(async (req, res) => {
  const classes = await Sclass.find();
  res.status(200).json({ success: true, classes });
});

export const getClassById = asyncHandler(async (req, res, next) => {
  const sclass = await Sclass.findById(req.params.id);
  if (!sclass) {
    return next(new ErrorHandler("Class not found", 404));
  }

  res.status(200).json({ success: true, sclass });
});

export const updateClass = asyncHandler(async (req, res, next) => {
  const sclass = await Sclass.findById(req.params.id);
  if (!sclass) {
    return next(new ErrorHandler("Class not found", 404));
  }

  const { sclassName, school } = req.body;
  if (sclassName) sclass.sclassName = sclassName;
  if (school) sclass.school = school;

  await sclass.save();

  res.status(200).json({ success: true, sclass });
});

export const deleteClass = asyncHandler(async (req, res, next) => {
  const sclass = await Sclass.findById(req.params.id);
  if (!sclass) {
    return next(new ErrorHandler("Class not found", 404));
  }

  await sclass.deleteOne();

  res.status(200).json({ success: true, message: "Class deleted successfully" });
});