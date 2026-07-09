import Assigment from "../models/assigmentModel.js";
import Teacher from "../models/teacherModel.js";
import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import cloudinary from "cloudinary";

export const createAssigment = asyncHandler(async (req, res, next) => {
  const { title, description, assignDate, deadline } = req.body;
  if (!title || !description || !assignDate || !deadline) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  if (!req.user || req.user.role !== "Teacher") {
    return next(new ErrorHandler("Only teachers can create assignments", 403));
  }

  const teacherProfile = await Teacher.findOne({ user: req.user._id }).select(
    "name email",
  );
  if (!teacherProfile) {
    return next(new ErrorHandler("Teacher profile not found", 404));
  }

  let imagePayload = undefined;
  if (req.files?.assigneFile) {
    const uploadResult = await cloudinary.v2.uploader.upload(
      req.files.assigneFile.tempFilePath,
      {
        folder: "AssigmentFiles",
      },
    );
    if (!uploadResult?.secure_url) {
      return next(new ErrorHandler("Assigment image upload failed", 500));
    }
    imagePayload = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  const assigment = await Assigment.create({
    title,
    description,
    assignDate: new Date(assignDate),
    deadline: new Date(deadline),
    assignedBy: teacherProfile._id,
    assigneFile: imagePayload || {},
  });

  const populatedAssignment = await Assigment.findById(assigment._id).populate(
    "assignedBy",
    "name",
  );

  res.status(201).json({
    success: true,
    assigment: populatedAssignment,
  });
});

export const getAllAssigments = asyncHandler(async (req, res, next) => {
  const assigments = await Assigment.find()
    .populate("assignedBy", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    assigments,
  });
});

export const getAssigmentById = asyncHandler(async (req, res, next) => {
  const assigment = await Assigment.findById(req.params.id).populate(
    "assignedBy",
    "name",
  );
  if (!assigment) {
    return next(new ErrorHandler("Assignment not found", 404));
  }

  res.status(200).json({
    success: true,
    assigment,
  });
});

export const updateAssigmentStatus = asyncHandler(async (req, res, next) => {
    const assigment = await Assigment.findById(req.params.id);
    if (!assigment) {
      return next(new ErrorHandler("Assignment not found", 404));
    }

    const { title, description, assignDate, deadline } = req.body;
    if (title) assigment.title = title;
    if (description) assigment.description = description;
    if (assignDate) assigment.assignDate = new Date(assignDate);
    if (deadline) assigment.deadline = new Date(deadline);

     if (req.files?.assigneFile) {
    const uploadResult = await cloudinary.v2.uploader.upload(req.files.assigneFile.tempFilePath, {
      folder: "AssigmentFiles",
    });
    if (!uploadResult?.secure_url) {
      return next(new ErrorHandler("Assigment image upload failed", 500));
    }
    assigment.assigneFile = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

    await assigment.save();

    res.status(200).json({
      success: true,
      assigment,
    });

});

export const deleteAssigment = asyncHandler(async (req, res, next) => {
  const assigment = await Assigment.findById(req.params.id);
  if (!assigment) {
    return next(new ErrorHandler("Assignment not found", 404));
  }

  await assigment.deleteOne();

  res.status(200).json({
    success: true,
    message: "Assignment deleted successfully",
  });
});
