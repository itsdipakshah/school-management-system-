import mongoose from "mongoose";

const complainSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Jo complain gari ra cha(Student or Teacher)
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin ,jasko nira complain jadai xa
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Complain = mongoose.model("complain", complainSchema);
export default Complain;