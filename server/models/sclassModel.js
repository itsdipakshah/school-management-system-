import mongoose from "mongoose";

const sClassSchema = new mongoose.Schema(
  {
    sclassName: {
      type: String,
      required: true,
    },
    section:{
      type: String,
      default: "A",
      enum: ["A", "B", "C", "D", "E"],

    },
    roomNum: {
      type: String,
    },
    school: {
      type: String,
      ref:"Admin",
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Sclass = mongoose.model("Sclass", sClassSchema);
export default Sclass;