import app from './app.js';
import cloudinary from 'cloudinary';

//Cloudinary configuration
cloudinary.v2.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

//server setup
const server = app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
});



//----------------
 //ERROR HANDLING 
//----------------

process.on('unhandledRejection',(err)=>{
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(()=>{
        process.exit(1);
    });
});
process.on('uncaughtException',(err)=>{
    console.error(`Uncaught Exception: ${err.message}`);
       process.exit(1);
});

export default server;