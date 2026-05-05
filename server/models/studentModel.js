import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    },
    dob: {
      type: Date,
      required: true,
    },
    rollNum: {
      type: Number,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minLength: [8, "Password must be at least 8 characters long"],
      maxLength: [128, "Password cannot exceed 128 characters"],
    },
    sclassName: {
      type: String,
      required: true,
      trim: true,
    },
    school: {
      type: String,
      required: true,
        trim: true,
    },
    role: {
      type: String,
      default: "student",
    },
    avatar:{
        public_id:{
            type:String,
            required:true,
        },
        url:{
            type:String,
            required:true,
        },
    },
    examResult: [
      {
        subName: {
          type: String,
          trim: true,
        },
        marksObtained: {
          type: Number,
          default: 0,
        },
      },
    ],
    attendance: [
      {
        date: {
          type: Date,
          required: true,
        },
        status: {
          type: String,
          enum: ["Present", "Absent","Late"],
          required: true,
        },
        subName: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;