import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "student",
      required: false,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "teacher",
      required: false,
    },
    type: {
      type: String,
      enum: ["student", "teacher"],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      required: false,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late"],
      default: "Present",
    },
  },
  { timestamps: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;