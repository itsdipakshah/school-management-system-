import express from 'express';
import { isAuthenticated, isAdmin } from '../middlewares/authorization.js';
import {
    getAdminDashboard,
    getAllStudents,
    getAllTeachers,
    getAllSubjects,
    getAllClasses,
    getAllNotices,
    getAllEvents,
    getAllResults,
    getAllFees,
    getAllAttendances,
    getAllComplaints,
    adminRegister,
    getAdminById,
    updateAdmin
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(isAuthenticated);
router.use(isAdmin);



// Dashboard overview
router.get('/dashboard', getAdminDashboard);

// Manage entities
router.get('/students', getAllStudents);
router.get('/teachers', getAllTeachers);
router.get('/subjects', getAllSubjects);
router.get('/classes', getAllClasses);
router.get('/notices', getAllNotices);
router.get('/events', getAllEvents);
router.get('/results', getAllResults);
router.get('/fees', getAllFees);
router.get('/attendances', getAllAttendances);
router.get('/complaints', getAllComplaints);

// Admin profile management
router.post('/register', adminRegister);
router.get('/:id', getAdminById);
router.put('/:id', updateAdmin);

export default router;