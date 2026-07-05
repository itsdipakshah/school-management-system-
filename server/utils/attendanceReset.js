import Attendance from "../models/attendanceModel.js";
import Student from "../models/studentModel.js";

export const getDayStart = (date = new Date()) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  return dayStart;
};

export const resetAttendanceRecords = async (
  {
    AttendanceModel = Attendance,
    StudentModel = Student,
  } = {},
  now = new Date(),
) => {
  const cutoff = getDayStart(now);

  const [attendanceResult, studentResult] = await Promise.all([
    AttendanceModel.deleteMany({ date: { $lt: cutoff } }),
    StudentModel.updateMany({}, { $pull: { attendance: { date: { $lt: cutoff } } } }),
  ]);

  return {
    deletedAttendanceCount: attendanceResult?.deletedCount ?? 0,
    updatedStudentsCount: studentResult?.modifiedCount ?? 0,
    cutoff,
  };
};

export const scheduleMidnightAttendanceReset = ({
  AttendanceModel = Attendance,
  StudentModel = Student,
  setTimeoutFn = globalThis.setTimeout,
} = {}) => {
  const runReset = async () => {
    try {
      await resetAttendanceRecords({ AttendanceModel, StudentModel });
    } catch (error) {
      console.error("Attendance reset failed:", error);
    }
  };

  const scheduleNextRun = () => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);

    const delay = nextMidnight.getTime() - now.getTime();
    setTimeoutFn(() => {
      runReset().finally(scheduleNextRun);
    }, delay);
  };

  runReset().finally(scheduleNextRun);
};
