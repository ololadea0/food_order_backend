const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    if (err.name === "ValidationError")
    {
        statusCode = 400;
    }

    if (err.code === 11000)
    {
        statusCode = 400;
        err.message = "Email already exists";
    }

    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack
    });
};

export default errorHandler;
