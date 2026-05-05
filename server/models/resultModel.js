import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sclass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sclass",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    examType: {
      type: String, //"Midterm", "Final", "Unit Test"
      required: true,
    },
    grade: {
      type: String,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }
  },
  { timestamps: true }
);

const Result = mongoose.model("Result", resultSchema);
export default Result;