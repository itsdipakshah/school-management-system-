import express from 'express';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import dbConnection from './database/dbConnection.js';

const app = express();

configDotenv();
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(cors({
    origin:process.env.FRONTEND_URL,
    methods:["GET","POST","PUT","DELETE","PATCH"],
    credentials:true,
    allowedHeaders:["Content-Type","Authorization","Multipart/Form-Data"]
}));




dbConnection();

export default app;