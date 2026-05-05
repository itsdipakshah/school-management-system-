import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description:{ 
        type: String,
        required: true 
    },
    date: { 
        type: Date, 
        required: true
     },
   school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", //(Admin)
      required: true,
    },
    audience: {
        type: String,
        enum: ["all", "student", "teacher"],
        default: "all"
    },
    noticeImage: {
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

const Notice = mongoose.model("Notice", noticeSchema);
export default Notice;
