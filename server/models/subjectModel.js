import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
    },
    subjectCode: {
      type: String,
      required: true,
    },
    sclass: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"Sclass",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"Teacher",
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"Admin",
      required: true,
    },
  },
  { timestamps: true }
);

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;