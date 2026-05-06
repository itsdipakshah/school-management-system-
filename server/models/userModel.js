import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";


const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please enter your name"]
    },
    email:{
        type:String,
        required:[true,"Please enter your email"],
        unique:true,
        lowercase:true,
        match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$/,"Please enter a valid email"]
    },
    password:{
        type:String,
        required:[true,"Please enter your password"],
        minLength:[8,"Password must be at least 8 characters long"],
        maxLength:[128,"Password cannot exceed 128 characters"],
        select:false,
    },
    role:{
        type:String,
        enum:["Admin","Teacher","Student"],
        default:"Student"
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date,
},{
    timestamps:true
});


//password database ma save garnu vanda aagadi password hash garne function ho
userSchema.pre("save",async function(){
    if(!this.isModified("password")){
        return;
    }
    this.password = await bcrypt.hash(this.password,10);
});

//token generate garne function ho
userSchema.methods.generateToken = function(){
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRE
    })
}

//hash gareko password lai compare garne function ho
userSchema.methods.comparePassword= async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password);
};

//password reset token generate garne function ho
userSchema.methods.getResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
};

const User = mongoose.model("User",userSchema);
export default User;