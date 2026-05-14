import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import Notice from "../models/noticeModel.js";
import Event from "../models/eventModel.js";
import Attendance from "../models/attendanceModel.js";
import Result from "../models/resultModel.js";
import Student from "../models/studentModel.js";
import Teacher from "../models/teacherModel.js";

export const getStudentDashboard = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    return next(new ErrorHandler("Student record not found", 404));
  }

  const [notices, events, attendances, results] = await Promise.all([
    Notice.find().sort({ date: -1 }).limit(10),
    Event.find({ eventDate: { $gte: new Date() } }).sort({ eventDate: 1 }).limit(10),
    Attendance.find({ student: student._id, type: "student" }).sort({ date: -1 }),
    Result.find({ student: req.user._id })
      .populate("subject", "subjectName subjectCode")
      .populate("sclass", "sclassName")
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    dashboard: {
      student: {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        schoolName: student.schoolName,
        sclassName: student.sclassName,
      },
      notices,
      events,
      attendances,
      results,
    },
  });
});

export const getTeacherDashboard = asyncHandler(async (req, res, next) => {
  const teacher = await Teacher.findOne({ user: req.user._id });
  if (!teacher) {
    return next(new ErrorHandler("Teacher record not found", 404));
  }

  const students = await Student.find({
    schoolName: teacher.school,
    sclassName: teacher.teachSclass,
  }).select("firstName lastName email rollNum sclassName schoolName user");

  const studentUserIds = students.map((student) => student.user);

  const [notices, events, attendances, studentResults] = await Promise.all([
    Notice.find().sort({ date: -1 }).limit(10),
    Event.find({ eventDate: { $gte: new Date() } }).sort({ eventDate: 1 }).limit(10),
    Attendance.find({ teacher: teacher._id, type: "teacher" }).sort({ date: -1 }),
    Result.find({ student: { $in: studentUserIds } })
      .populate("student", "name email")
      .populate("subject", "subjectName subjectCode")
      .populate("sclass", "sclassName")
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    dashboard: {
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        school: teacher.school,
        teachSubject: teacher.teachSubject,
        teachSclass: teacher.teachSclass,
      },
      notices,
      events,
      attendances,
      students,
      studentResults,
    },
  });
});
