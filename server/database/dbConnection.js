import mongoose from "mongoose";

const dbConnection = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL,{
            dbName:process.env.DB_NAME,
        }).then(()=>{
            console.log("Database connected successfully");
        })
    } catch (error) {
        console.log("some error occurred while connecting to database",error);
    }
}

export default dbConnection;