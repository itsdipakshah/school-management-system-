import mongoose from "mongoose";

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Student UserID
      required: true,
    },
    sclass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sclass", // kun class ko fee ho
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    feeType: {
      type: String, 
      enum: ["Tuition", "Library", "Exam", "Transport", "Other"],
      default: "Tuition",
    },
     totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Partially Paid"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Online", "Bank Transfer"],
         default: "Cash",
    },
    
    date: {
      type: Date,
      default: Date.now,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin ID
      required: true,
    }
  },
  { timestamps: true }
);

const Fee = mongoose.model("fee", feeSchema);
export default Fee;