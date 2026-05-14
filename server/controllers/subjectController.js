import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import Subject from "../models/subjectModel.js";
import Teacher from "../models/teacherModel.js";
import Sclass from "../models/sclassModel.js";

export const createSubject = asyncHandler(async (req, res, next) => {
  const { subjectName, subjectCode, sclass, teacher } = req.body;

  if (!subjectName || !subjectCode || !sclass || !teacher) {
    return next(new ErrorHandler("All subject fields are required", 400));
  }

  const classExists = await Sclass.findById(sclass);
  const teacherExists = await Teacher.findById(teacher);

  if (!classExists) {
    return next(new ErrorHandler("Class not found", 404));
  }
  if (!teacherExists) {
    return next(new ErrorHandler("Teacher not found", 404));
  }

  const subject = await Subject.create({
    subjectName,
    subjectCode,
    sclass,
    teacher,
    school: req.user._id,
  });

  res.status(201).json({
    success: true,
    subject,
  });
});

export const getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find()
    .populate("sclass", "sclassName")
    .populate("teacher", "name email teachSubject teachSclass");

  res.status(200).json({
    success: true,
    subjects,
  });
});

export const getSubjectById = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id)
    .populate("sclass", "sclassName")
    .populate("teacher", "name email teachSubject teachSclass");

  if (!subject) {
    return next(new ErrorHandler("Subject not found", 404));
  }

  res.status(200).json({
    success: true,
    subject,
  });
});

export const updateSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return next(new ErrorHandler("Subject not found", 404));
  }

  const { subjectName, subjectCode, sclass, teacher } = req.body;

  if (subjectName) subject.subjectName = subjectName;
  if (subjectCode) subject.subjectCode = subjectCode;
  if (sclass) {
    const classExists = await Sclass.findById(sclass);
    if (!classExists) {
      return next(new ErrorHandler("Class not found", 404));
    }
    subject.sclass = sclass;
  }
  if (teacher) {
    const teacherExists = await Teacher.findById(teacher);
    if (!teacherExists) {
      return next(new ErrorHandler("Teacher not found", 404));
    }
    subject.teacher = teacher;
  }

  await subject.save();

  res.status(200).json({
    success: true,
    subject,
  });
});

export const deleteSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return next(new ErrorHandler("Subject not found", 404));
  }

  await subject.deleteOne();

  res.status(200).json({
    success: true,
    message: "Subject deleted successfully",
  });
});