import Admin from '../models/adminModel.js';
import User from '../models/userModel.js';
import Student from '../models/studentModel.js';
import Teacher from '../models/teacherModel.js';
import Subject from '../models/subjectModel.js';
import Sclass from '../models/sclassModel.js';
import Notice from '../models/noticeModel.js';
import Event from '../models/eventModel.js';
import Result from '../models/resultModel.js';
import Fee from '../models/feeModel.js';
import Attendance from '../models/attendanceModel.js';
import Complain from '../models/complainModel.js';
import {asyncHandler} from '../middlewares/asyncHandler.js';
import { generateToken } from '../utils/generateToken.js';

/*
// Register Admin
export const registerAdmin = asyncHandler(async (req, res, next) => {
    const { firstName, lastName,email, password, phone, address, schoolName, avatar } = req.body;

    if (!email || !password || !firstName || !lastName || !phone || !schoolName) {
        return res.status(400).json({ message: 'Please fill all required fields' });
    }

    let user = await User.findOne({ email });
    if (user) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Create user with role Admin
    user = new User({ firstName, lastName, email, password, role: 'Admin' });
    await user.save();

    // Create admin profile
    const admin = new Admin({
        user: user._id,
        firstName,
        lastName,
        phone,
        email,
        password, // Note: password is stored in both, but auth uses user
        address,
        schoolName,
        avatar
    });
    await admin.save();

    generateToken(user, 201, 'Admin registered successfully', res);
});

// Update Admin Profile
export const updateAdminProfile = asyncHandler(async (req, res) => {
    const adminId = req.user.id;
    const { firstName, lastName, phone, address, schoolName, avatar } = req.body;

    const admin = await Admin.findOne({ user: adminId });
    if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
    }

    // Update fields
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phone) admin.phone = phone;
    if (address) admin.address = address;
    if (schoolName) admin.schoolName = schoolName;
    if (avatar) admin.avatar = avatar;

    await admin.save();

    res.status(200).json({ message: 'Profile updated successfully', admin });
});


*/

//Admin Dashboard Overview
export const getAdminDashboard = asyncHandler(async (req, res) => {
    // Fetch counts
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalSubjects = await Subject.countDocuments();
    const totalClasses = await Sclass.countDocuments();
    const totalNotices = await Notice.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalResults = await Result.countDocuments();
    const totalFees = await Fee.countDocuments();
    const totalAttendances = await Attendance.countDocuments();
    const totalComplaints = await Complain.countDocuments();

    // Recent notices (last 5)
    const recentNotices = await Notice.find().sort({ createdAt: -1 }).limit(5).select('title content createdAt');

    // Upcoming events (next 5)
    const upcomingEvents = await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5).select('title date description');

    // Recent results (last 5)
    const recentResults = await Result.find().sort({ createdAt: -1 }).limit(5).populate('student', 'name').populate('subject', 'subjectName').select('marks grade');

    // Fee summary (total pending fees)
    const pendingFees = await Fee.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalPendingFees = pendingFees.length > 0 ? pendingFees[0].total : 0;

    // Attendance summary (last 30 days average for students)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attendanceRecords = await Attendance.find({ date: { $gte: thirtyDaysAgo }, type: 'student' });
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(record => record.status === 'Present').length;
    const avgAttendance = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) + '%' : '0%';

    res.status(200).json({
        totalStudents,
        totalTeachers,
        totalSubjects,
        totalClasses,
        totalNotices,
        totalEvents,
        totalResults,
        totalFees,
        totalAttendances,
        totalComplaints,
        recentNotices,
        upcomingEvents,
        recentResults,
        totalPendingFees,
        avgAttendance: avgAttendance.toFixed(2) + '%'
    });
});

// Get all students (for admin to manage)
export const getAllStudents = asyncHandler(async (req, res) => {
    const students = await Student.find().select('name email rollNum sclassName');
    res.status(200).json(students);
});

// Get all teachers
export const getAllTeachers = asyncHandler(async (req, res) => {
    const teachers = await Teacher.find().select('name email teachSubject teachSclass');
    res.status(200).json(teachers);
});

// Get all subjects
export const getAllSubjects = asyncHandler(async (req, res) => {
    const subjects = await Subject.find().populate('sclass', 'sclassName');
    res.status(200).json(subjects);
});

// Get all classes
export const getAllClasses = asyncHandler(async (req, res) => {
    const classes = await Sclass.find();
    res.status(200).json(classes);
});

// Get all notices
export const getAllNotices = asyncHandler(async (req, res) => {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json(notices);
});

// Get all events
export const getAllEvents = asyncHandler(async (req, res) => {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json(events);
});

// Get all results
export const getAllResults = asyncHandler(async (req, res) => {
    const results = await Result.find().populate('student', 'name').populate('subject', 'subjectName').populate('exam', 'examName');
    res.status(200).json(results);
});

// Get all fees
export const getAllFees = asyncHandler(async (req, res) => {
    const fees = await Fee.find().populate('student', 'name').sort({ dueDate: 1 });
    res.status(200).json(fees);
});

// Get all attendances
export const getAllAttendances = asyncHandler(async (req, res) => {
    const attendances = await Attendance.find().populate('sclass', 'sclassName').sort({ date: -1 });
    res.status(200).json(attendances);
});

// Get all complaints
export const getAllComplaints = asyncHandler(async (req, res) => {
    const complaints = await Complain.find().populate('student', 'name').sort({ createdAt: -1 });
    res.status(200).json(complaints);
});