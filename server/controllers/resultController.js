import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import Result from "../models/resultModel.js";

import Subject from "../models/subjectModel.js";
import Sclass from "../models/sclassModel.js";
import Student from "../models/studentModel.js";

const calculateGrade = (marksObtained, totalMarks) => {
  const percentage = (marksObtained / totalMarks) * 100;
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
};

export const addResult = asyncHandler(async (req, res, next) => {
  const { student, sclass, subject, marksObtained, totalMarks, examType, grade } = req.body;

  if (!student || !sclass || !subject || marksObtained === undefined || !examType) {
    return next(new ErrorHandler("All result fields are required", 400));
  }

  const studentExists = await Student.findById(student);
  const subjectExists = await Subject.findById(subject);
  const classExists = await Sclass.findById(sclass);

  if (!studentExists) {
    return next(new ErrorHandler("Student not found", 404));
  }
  if (!subjectExists) {
    return next(new ErrorHandler("Subject not found", 404));
  }
  if (!classExists) {
    return next(new ErrorHandler("Class not found", 404));
  }

  const existingResults = await Result.find({ student, sclass, subject });
  if (existingResults.length) {
    const existingResult = existingResults[0];
    existingResult.marksObtained = marksObtained;
    existingResult.totalMarks = totalMarks || 100;
    existingResult.examType = examType;
    existingResult.grade = grade || calculateGrade(marksObtained, totalMarks || 100);
    await existingResult.save();

    if (existingResults.length > 1) {
      const duplicateIds = existingResults.slice(1).map((item) => item._id);
      await Result.deleteMany({ _id: { $in: duplicateIds } });
    }

    return res.status(200).json({
      success: true,
      result: existingResult,
      updated: true,
    });
  }

  const result = await Result.create({
    student,
    sclass,
    subject,
    marksObtained,
    totalMarks: totalMarks || 100,
    examType,
    grade: grade || calculateGrade(marksObtained, totalMarks || 100),
    school: req.user._id,
  });

  res.status(201).json({
    success: true,
    result,
  });
});

export const getAllResults = asyncHandler(async (req, res) => {
  const query = req.user.role === "Student" ? { student: req.user._id } : {};
  const results = await Result.find(query)
    .populate("student", "name email")
    .populate("subject", "subjectName subjectCode")
    .populate("sclass", "sclassName");

  res.status(200).json({
    success: true,
    results,
  });
});

export const getResultById = asyncHandler(async (req, res, next) => {
  const result = await Result.findById(req.params.id)
    .populate("student", "name email")
    .populate("subject", "subjectName subjectCode")
    .populate("sclass", "sclassName");

  if (!result) {
    return next(new ErrorHandler("Result not found", 404));
  }

  if (req.user.role === "Student") {
    const studentId = result.student?._id || result.student;
    if (!studentId.equals(req.user._id)) {
      return next(new ErrorHandler("Access denied. Not your result record.", 403));
    }
  }

  res.status(200).json({
    success: true,
    result,
  });
});

export const updateResult = asyncHandler(async (req, res, next) => {
  const result = await Result.findById(req.params.id);
  if (!result) {
    return next(new ErrorHandler("Result not found", 404));
  }

  const { marksObtained, totalMarks, examType, grade } = req.body;

  if (marksObtained !== undefined) result.marksObtained = marksObtained;
  if (totalMarks !== undefined) result.totalMarks = totalMarks;
  if (examType) result.examType = examType;
  result.grade = grade || calculateGrade(result.marksObtained, result.totalMarks);

  await result.save();

  res.status(200).json({
    success: true,
    result,
  });
});

export const deleteResult = asyncHandler(async (req, res, next) => {
  const result = await Result.findById(req.params.id);
  if (!result) {
    return next(new ErrorHandler("Result not found", 404));
  }

  await result.deleteOne();

  res.status(200).json({
    success: true,
    message: "Result deleted successfully",
  });
});