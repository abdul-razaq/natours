module.exports = class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    // Make sure the AppError constructor function does not appear in the stack trace when an instance of this constructor function is created.
    Error.captureStackTrace(this, this.constructor);
  }
};
