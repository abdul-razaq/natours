const util = require('util');

const jwt = require('jsonwebtoken');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const validateToken = tokenString => {
  let token;
  if (tokenString && tokenString.startsWith('Bearer')) {
    token = tokenString.replace('Bearer ', '');
  }
  return token;
}

module.exports = catchAsync(async (req, res, next) => {
  const token = validateToken(req.headers.authorization);

  if (!token) {
    return next(new AppError('please provide a valid token!', 401));
  }
  const payload = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  const authUser = await User.findById(payload.id);
  if (!authUser) {
    return next(
      new AppError('user belonging to this token no longer exists.', 401)
    );
  }
  if (authUser.hasPasswordChanged(payload.iat)) {
    return next(
      new AppError('user recently changed password! please login again.', 401)
    );
  }
  req.user = authUser;
  next();
});
