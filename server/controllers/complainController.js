import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import Complain from "../models/complainModel.js";

export const createComplaint = asyncHandler(async (req, res, next) => {
  const { title, description, school } = req.body;

  if (!title || !description || !school) {
    return next(new ErrorHandler("Title, description, and school id are required", 400));
  }

  const complaint = await Complain.create({
    user: req.user._id,
    title,
    description,
    school: req.user._id,
  });

  res.status(201).json({ success: true, complaint });
});

export const getAllComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complain.find().populate("user", "name email").sort({ createdAt: -1 });
  res.status(200).json({ success: true, complaints });
});

export const getComplaintById = asyncHandler(async (req, res, next) => {
  const complaint = await Complain.findById(req.params.id).populate("user", "name email");
  if (!complaint) {
    return next(new ErrorHandler("Complaint not found", 404));
  }

  if (req.user.role !== "Admin" && complaint.user._id.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Access denied", 403));
  }

  res.status(200).json({ success: true, complaint });
});

export const updateComplaintStatus = asyncHandler(async (req, res, next) => {
  const complaint = await Complain.findById(req.params.id);
  if (!complaint) {
    return next(new ErrorHandler("Complaint not found", 404));
  }

  const { status } = req.body;
  if (!status) {
    return next(new ErrorHandler("Status is required to update complaint", 400));
  }

  complaint.status = status;
  await complaint.save();

  res.status(200).json({ success: true, complaint });
});

export const deleteComplaint = asyncHandler(async (req, res, next) => {
  const complaint = await Complain.findById(req.params.id);
  if (!complaint) {
    return next(new ErrorHandler("Complaint not found", 404));
  }

  if (req.user.role !== "Admin" && complaint.user._id.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Access denied", 403));
  }

  await complaint.remove();
  res.status(200).json({ success: true, message: "Complaint deleted successfully" });
});