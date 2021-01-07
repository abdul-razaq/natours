const AppError = require('../utils/appError');

const handleDBCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}.`, 400);

const handleDBDuplicateFields = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  return new AppError(
    `Duplicate field value: ${value}. Please use another value!`,
    400
  );
};

const handleDBValidationError = (err) => new AppError(err.message, 400);

const handleJWTError = () => new AppError('invalid token provided.', 401);

const handleJWTExpiredError = () =>
  new AppError('your token has expired!', 401);

const sendDevError = (err, res) => {
  !err.statusCode && ((err.statusCode = 400), (err.status = 'fail'));
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendProdError = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  console.error(`ERROR: ${err}`);
  return res.status(500).json({
    status: 'error',
    message: 'something went terribly wrong!',
  });
};

// GLOBAL ERROR HANDLING MIDDLEWARE
module.exports = (err, req, res, next) => {
  let error = Object.create(err);
  if (process.env.NODE_ENV === 'development') {
    sendDevError(error, res);
  } else {
    // Transform the series of error objects that we receive from Mongoose and MongoDB into an Operational Error marked with our own AppError class.
    if (error.name === 'CastError') error = handleDBCastError(error);
    if (error.code === 11000) error = handleDBDuplicateFields(error);
    if (error.name === 'ValidationError')
      error = handleDBValidationError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError();

    sendProdError(error, res);
  }
};
