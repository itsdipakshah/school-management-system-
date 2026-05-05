import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        match:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    password:{
        type:String,
        required:true,
        minLength:[8,"Password must be at least 8 characters long"],
        maxLength:[128,"Password cannot exceed 128 characters"],
    },
    role:{
        type:String,
        enum:["admin","teacher","student"],
        default:"student"
    }
});

const User = mongoose.model("User",userSchema);
export default User;