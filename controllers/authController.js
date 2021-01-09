const validator = require('validator');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const signToken = require('../utils/signToken');
const Email = require('../utils/email');

const createAndSendToken = (status, message, user, req, res) => {
  const token = signToken(user._id);

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });
  user.password = undefined;
  res.status(status).json({
    status: 'success',
    message,
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createAndSendToken(201, 'user account created successfully!', newUser, req, res);
});

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('please provide email address and password', 400));
  }
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.verifyPassword(password, user.password))) {
    return next(new AppError('invalid email or password.', 401));
  }
  createAndSendToken(200, 'logged in successfully.', user, req, res);
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email || !validator.isEmail(req.body.email)) {
    return next(new AppError('please provide a valid email address.', 400));
  }
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('user with this email address does not exist.', 404)
    );
  }
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'token sent successfully!',
    });
  } catch (err) {
    (user.passwordResetToken = undefined),
      (user.passwordResetExpires = undefined);
    await user.save({ validateBeforeSave: false });
    return next(new AppError('error sending email. try again in a bit.'), 500);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Token is invalid or has expired!', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createAndSendToken(200, 'password changed successfully!', user, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  if (
    !req.body.oldPassword &&
    !req.body.newPassword &&
    !req.body.passwordConfirm
  ) {
    return next(
      new AppError(
        'the following fields are required: oldPassword, newPassword, passwordConfirm',
        400
      )
    );
  }
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.verifyPassword(req.body.oldPassword, user.password))) {
    return next(new AppError('old password provided is incorrect.', 401));
  }
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createAndSendToken(200, 'password updated successfully!', user, req, res);
});

/****** VIEWS CONTROLLERS HERE ******/
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
