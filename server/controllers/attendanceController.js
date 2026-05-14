import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import Attendance from "../models/attendanceModel.js";
import Student from "../models/studentModel.js";
import Teacher from "../models/teacherModel.js";

export const markStudentAttendance = asyncHandler(async (req, res, next) => {
  const { student, name, class:studentClass, status, date, subName } = req.body;

  if (!student || !name || !studentClass || !status) {
    return next(new ErrorHandler("Student attendance fields are required", 400));
  }

  const studentExists = await Student.findById(student);
  if (!studentExists) {
    return next(new ErrorHandler("Student not found", 404));
  }

  const attendance = await Attendance.create({
    student,
    type: "student",
    name,
    class: studentClass,
    status,
    date: date ? new Date(date) : new Date(),
    subName: subName || "",
  });

  res.status(201).json({
    success: true,
    attendance,
  });
});

export const markTeacherAttendance = asyncHandler(async (req, res, next) => {
  const { teacher, name, status, date } = req.body;

  if (!teacher || !name || !status) {
    return next(new ErrorHandler("Teacher attendance fields are required", 400));
  }

  const teacherExists = await Teacher.findById(teacher);
  if (!teacherExists) {
    return next(new ErrorHandler("Teacher not found", 404));
  }

  const attendance = await Attendance.create({
    teacher,
    type: "teacher",
    name,
    status,
    date: date ? new Date(date) : new Date(),
  });

  res.status(201).json({
    success: true,
    attendance,
  });
});

export const getMyAttendance = asyncHandler(async (req, res, next) => {
  if (req.user.role === "Student") {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return next(new ErrorHandler("Student record not found", 404));
    }
    const attendances = await Attendance.find({ student: student._id, type: "student" }).sort({ date: -1 });
    return res.status(200).json({ success: true, attendances });
  }

  if (req.user.role === "Teacher") {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) {
      return next(new ErrorHandler("Teacher record not found", 404));
    }
    const attendances = await Attendance.find({ teacher: teacher._id, type: "teacher" }).sort({ date: -1 });
    return res.status(200).json({ success: true, attendances });
  }

  return next(new ErrorHandler("Access denied.", 403));
});

export const getAllAttendances = asyncHandler(async (req, res) => {
  const attendances = await Attendance.find().sort({ date: -1 });
  res.status(200).json({
    success: true,
    attendances,
  });
});

export const getAttendanceById = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) {
    return next(new ErrorHandler("Attendance record not found", 404));
  }

  if (req.user.role === "Student") {
    const student = await Student.findOne({ user: req.user._id });
    if (!student || !attendance.student?.equals(student._id)) {
      return next(new ErrorHandler("Access denied. Not your attendance record.", 403));
    }
  }

  if (req.user.role === "Teacher" && attendance.type === "teacher") {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher || !attendance.teacher?.equals(teacher._id)) {
      return next(new ErrorHandler("Access denied. Not your attendance record.", 403));
    }
  }

  res.status(200).json({
    success: true,
    attendance,
  });
});

export const updateAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) {
    return next(new ErrorHandler("Attendance record not found", 404));
  }

  const { status, date, name, class: studentClass, subName } = req.body;
  if (status) attendance.status = status;
  if (date) attendance.date = new Date(date);
  if (name) attendance.name = name;
  if (studentClass) attendance.class = studentClass;
  if (subName !== undefined) attendance.subName = subName;

  await attendance.save();

  res.status(200).json({
    success: true,
    attendance,
  });
});

export const deleteAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) {
    return next(new ErrorHandler("Attendance record not found", 404));
  }

  await attendance.deleteOne();

  res.status(200).json({
    success: true,
    message: "Attendance record removed successfully",
  });
});