class ErrorHandler extends Error{
    constructor(message , statusCode){
        super(message);
        this.statusCode = statusCode;
    }
};


export const errorMiddleware = (err,req,res,next) =>{
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    if (res.headersSent) {
        return next(err);
    }

    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler(message, 400);
    };

    if (err.name === "JsonWebTokenError") {
        const message = "Invalid Token, Please try again";
        err = new ErrorHandler(message, 400);
    };
    if (err.name === "TokenExpiredError") {
        const message = "Invalid Token, Please try again";
        err = new ErrorHandler(message, 400);
    };
    if (err.name === "castError") {
        const message = "Resource not found. Invalid: " + err.path;
        err = new ErrorHandler(message, 400);
    };
   //mongoose le validation error ko format ma error pathaune garcha ani teslai handle garna parcha
    const errorMessage = err.errors ? Object.values(err.errors).map((value )=> value.message).join(", ") : err.message;

   return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });

}

export default ErrorHandler;

