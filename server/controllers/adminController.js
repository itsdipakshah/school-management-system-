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
import ErrorHandler from '../middlewares/error.js';
import cloudinary from 'cloudinary';


// Register Admin
export const adminRegister = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, email, password, phone, schoolName, street, city, state, zip, avatar } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone || !schoolName) {
        return next(new ErrorHandler("Please fill all required fields", 400));
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
        return next(new ErrorHandler("Email already registered", 400));
    }

    // Check if admin with same email already exists
    let adminExists = await Admin.findOne({ email });
    if (adminExists) {
        return next(new ErrorHandler("Admin with this email already exists", 400));
    }

    // Create User record with Admin role
    user = new User({
        name: `${firstName} ${lastName}`,
        email,
        password,
        role: "Admin"
    });
    await user.save();

    // Upload avatar if present
    const adminAvatarFile = req.files?.adminAvatar || req.files?.avatar;
    let avatarData = {
        public_id: "default",
        url: "https://via.placeholder.com/150"
    };

    if (adminAvatarFile) {
        const uploadResult = await cloudinary.v2.uploader.upload(adminAvatarFile.tempFilePath, {
            folder: "AdminAvatars",
            transformation: [{ width: 300, height: 300, crop: "fill" }],
        });

        if (!uploadResult?.secure_url) {
            return next(new ErrorHandler("Avatar upload failed", 500));
        }

        avatarData = {
            public_id: uploadResult.public_id,
            url: uploadResult.secure_url,
        };
    }

    // Create Admin profile
    const adminProfile = new Admin({
        user: user._id,
        firstName,
        lastName,
        email,
        password,
        phone,
        schoolName,
        role: "Admin",
        address: {
            street: street || "",
            city: city || "",
            state: state || "",
            zip: zip || ""
        },
        avatar: avatarData
    });
    await adminProfile.save();

    // Populate user reference before returning
    await adminProfile.populate('user', '-password');

    return res.status(201).json({
        success: true,
        message: "Admin registered successfully",
        admin: adminProfile
    });
});

// Get Admin by ID
export const getAdminById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const admin = await Admin.findById(id).populate('user', '-password -resetPasswordToken -resetPasswordExpire');
    
    if (!admin) {
        return next(new ErrorHandler("Admin not found", 404));
    }

    res.status(200).json({
        success: true,
        admin
    });
});

// Update Admin Profile
export const updateAdmin = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { firstName, lastName, phone, street, city, state, zip, email } = req.body;

    // Check if admin exists
    let admin = await Admin.findById(id);
    if (!admin) {
        return next(new ErrorHandler("Admin not found", 404));
    }

    // Authorization: Only the same admin 
    if (req.user.role !== 'Admin') {
        return next(new ErrorHandler("Access denied. Only admins can update admin profiles.", 403));
    }

    // Check if new email is already taken (if email is being changed)
    if (email && email !== admin.email) {
        const emailExists = await Admin.findOne({ email });
        if (emailExists) {
            return next(new ErrorHandler("Email already in use", 400));
        }
        // Also update in User collection
        await User.findByIdAndUpdate(admin.user, { email }, { new: true });
    }

    // Keep the linked user name in sync
    if ((firstName || lastName) && admin.user) {
        const existingUser = await User.findById(admin.user).select('+password');
        if (existingUser) {
            existingUser.name = `${firstName || admin.firstName} ${lastName || admin.lastName}`;
            await existingUser.save();
        }
    }

    // Update admin fields
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phone) admin.phone = phone;
    if (email) admin.email = email;
    if (street || city || state || zip) {
        admin.address = {
            street: street || admin.address.street,
            city: city || admin.address.city,
            state: state || admin.address.state,
            zip: zip || admin.address.zip
        };
    }

    const avatarFile = req.files?.adminAvatar || req.files?.avatar;
    if (avatarFile) {
        if (admin.avatar?.public_id && admin.avatar.public_id !== "default") {
            await cloudinary.v2.uploader.destroy(admin.avatar.public_id);
        }

        const uploadResult = await cloudinary.v2.uploader.upload(avatarFile.tempFilePath, {
            folder: "AdminAvatars",
            transformation: [{ width: 300, height: 300, crop: "fill" }],
        });

        if (!uploadResult?.secure_url) {
            return next(new ErrorHandler("Avatar upload failed", 500));
        }

        admin.avatar = {
            public_id: uploadResult.public_id,
            url: uploadResult.secure_url,
        };
    }

    await admin.save();

    // Populate user reference before returning
    await admin.populate('user', '-password -resetPasswordToken -resetPasswordExpire');

    res.status(200).json({
        success: true,
        message: "Admin updated successfully",
        admin
    });
});

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
    const avgAttendance = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

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
        avgAttendance: `${avgAttendance.toFixed(2)}%`
    });
});

// Get all students (for admin to manage)
export const getAllStudents = asyncHandler(async (req, res) => {
    const students = await Student.find().select('firstName lastName email rollNum sclassName schoolName');
    res.status(200).json(students);
});

// Get all teachers
export const getAllTeachers = asyncHandler(async (req, res) => {
    const teachers = await Teacher.find().select('name email teachSubject teachSclass school');
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
    const results = await Result.find().populate('student', 'name email').populate('subject', 'subjectName');
    res.status(200).json(results);
});

// Get all fees
export const getAllFees = asyncHandler(async (req, res) => {
    const fees = await Fee.find().populate('student', 'name email').sort({ date: -1 });
    res.status(200).json(fees);
});

// Get all attendances
export const getAllAttendances = asyncHandler(async (req, res) => {
    const attendances = await Attendance.find().sort({ date: -1 });
    res.status(200).json(attendances);
});

// Get all complaints
export const getAllComplaints = asyncHandler(async (req, res) => {
    const complaints = await Complain.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json(complaints);
});

