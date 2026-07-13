import mongoose from "mongoose";

const assigmentSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        required:true,
    },
    assignDate:{
        type:Date,
        required:true,
    },
    deadline:{
        type:Date,
        required:true,
    },
    classId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Sclass",
        required:true,
    },
    subjectId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Subject",
        required:true,
    },
    assignedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Teacher",
        required:true
    },
    assigneFile:{
        public_id:{type:String},
        url:{type:String}
    },
},{timestamps:true});

export default mongoose.model("Assigment", assigmentSchema);