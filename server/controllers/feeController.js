import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import Fee from "../models/feeModel.js";
import User from "../models/userModel.js";
import Student from "../models/studentModel.js";
import Sclass from "../models/sclassModel.js";

export const createFee = asyncHandler(async (req, res, next) => {
  const { student, sclass, amount, feeType, totalAmount, paymentStatus, paymentMethod } = req.body;

  if (!student || !sclass || amount === undefined) {
    return next(new ErrorHandler("Student, class, and amount are required to create a fee record", 400));
  }

  let studentUserId = student;
  let studentExists = await User.findById(studentUserId);
  if (!studentExists) {
    const studentRecord = await Student.findById(student);
    if (studentRecord?.user) {
      studentUserId = studentRecord.user;
      studentExists = await User.findById(studentUserId);
    }
  }

  const classExists = await Sclass.findById(sclass);

  if (!studentExists) {
    return next(new ErrorHandler("Student user not found", 404));
  }
  if (!classExists) {
    return next(new ErrorHandler("Class not found", 404));
  }

  const fee = await Fee.create({
    student: studentUserId,
    sclass,
    amount,
    feeType: feeType || "Tuition",
    totalAmount: totalAmount || amount,
    paymentStatus: paymentStatus || "Pending",
    paymentMethod: paymentMethod || "Cash",
    school: req.user._id,
  });

  res.status(201).json({ success: true, fee });
});

export const getAllFees = asyncHandler(async (req, res) => {
  const fees = await Fee.find()
    .populate("student", "name email")
    .populate("sclass", "sclassName")
    .sort({ date: -1 });

  res.status(200).json({ success: true, fees });
});

export const getFeeById = asyncHandler(async (req, res, next) => {
  const fee = await Fee.findById(req.params.id)
    .populate("student", "name email")
    .populate("sclass", "sclassName");

  if (!fee) {
    return next(new ErrorHandler("Fee record not found", 404));
  }

  res.status(200).json({ success: true, fee });
});

export const updateFee = asyncHandler(async (req, res, next) => {
  const fee = await Fee.findById(req.params.id);
  if (!fee) {
    return next(new ErrorHandler("Fee record not found", 404));
  }

  const { amount, feeType, totalAmount, paymentStatus, paymentMethod } = req.body;
  if (amount !== undefined) fee.amount = amount;
  if (feeType) fee.feeType = feeType;
  if (totalAmount !== undefined) fee.totalAmount = totalAmount;
  if (paymentStatus) fee.paymentStatus = paymentStatus;
  if (paymentMethod) fee.paymentMethod = paymentMethod;

  await fee.save();

  res.status(200).json({ success: true, fee });
});

export const deleteFee = asyncHandler(async (req, res, next) => {
  const fee = await Fee.findById(req.params.id);
  if (!fee) {
    return next(new ErrorHandler("Fee record not found", 404));
  }

  await fee.deleteOne();

  res.status(200).json({ success: true, message: "Fee record deleted successfully" });
});