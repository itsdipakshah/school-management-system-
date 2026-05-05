import mongoose from "mongoose";

const sClassSchema = new mongoose.Schema(
  {
    sclassName: {
      type: String,
      required: true,
    },
    school: {
      type: String,
      ref:"Admin",
    },
  },
  { timestamps: true }
);

const Sclass = mongoose.model("Sclass", sClassSchema);
export default Sclass;