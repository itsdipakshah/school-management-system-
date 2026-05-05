import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minLength: [8, "Password must be at least 8 characters long"],
      maxLength: [128, "Password cannot exceed 128 characters"],
    },
    role: {
      type: String,
      default: "teacher",
    },
    school: {
      type: String,
      required: true,
    },
    teachSubject: {
      type: String,
    },
    teachSclass: {
      type: String,
      required: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    salary: {
      type: Number,
    },
    attendance: [
      {
        date: {
          type: Date,
          required: true,
        },
        status: {
          type: String,
          enum: ["Present", "Absent", "Late"],
          required: true,
        },
      },
    ],
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true },
);

const Teacher = mongoose.model("Teacher", teacherSchema);
export default Teacher;
