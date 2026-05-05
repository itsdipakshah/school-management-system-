import mongoose, { mongo } from "mongoose";

const adminSchema = new mongoose.Schema({
    user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    },
   firstName: {
    type: String,
    required: true,
   },
   lastName: {
    type: String,
    required: true,
  },
  phone: {
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
  role: {
    type: String,
    default: "Admin",
    required: true,
  },
   password:{
        type:String,
        required:true,
        minLength:[8,"Password must be at least 8 characters long"],
        maxLength:[128,"Password cannot exceed 128 characters"],
    },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
  },
  schoolName: {
    type: String,
    unique: true,
    required: true,
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
});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;