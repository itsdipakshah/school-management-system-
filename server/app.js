import express from 'express';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import dbConnection from './database/dbConnection.js';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './middlewares/error.js';
import userRoutes from './routers/userRoutes.js';


const app = express();
configDotenv();

//middlewares
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(cors({
    origin:process.env.FRONTEND_URL,
    methods:["GET","POST","PUT","DELETE","PATCH"],
    credentials:true
}));


//Routes
app.use("/api/v1/users",userRoutes);


//database connection
dbConnection();
//error handler middleware
app.use(errorMiddleware);
export default app;