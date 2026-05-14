import express from 'express';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import dbConnection from './database/dbConnection.js';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './middlewares/error.js';
import userRoutes from './routers/userRoutes.js';
import adminRoutes from './routers/adminRoutes.js';
import attendanceRoutes from './routers/attendanceRoutes.js';
import complainRoutes from './routers/complainRoutes.js';
import eventRoutes from './routers/eventRoutes.js';
import feeRoutes from './routers/feeRoutes.js';
import noticeRoutes from './routers/noticeRoutes.js';
import resultRoutes from './routers/resultRoutes.js';
import sclassRoutes from './routers/sclassRoutes.js';
import studentRoutes from './routers/studentRoutes.js';
import subjectRoutes from './routers/subjectRoutes.js';
import teacherRoutes from './routers/teacherRoutes.js';
import dashboardRoutes from './routers/dashboardRoutes.js';
import fileUpload from 'express-fileupload';



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

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
 })
);

//Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/teachers", teacherRoutes);
app.use("/api/v1/subjects", subjectRoutes);
app.use("/api/v1/classes", sclassRoutes);
app.use("/api/v1/notices", noticeRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/results", resultRoutes);
app.use("/api/v1/fees", feeRoutes);
app.use("/api/v1/attendances", attendanceRoutes);
app.use("/api/v1/complaints", complainRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);


//database connection
dbConnection();
//error handler middleware
app.use(errorMiddleware);
export default app;