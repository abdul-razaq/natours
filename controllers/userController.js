const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const filterObj = require('../helpers/filterObject');
const handlerFactory = require('./handlerFactory');

// Multer is a very popular MIDDLEWARE to handle multi-part form data.

// Firstly, We create a Multer Storage.
// Secondly, We create a Multer Filter.

// This multer storage StorageEngine allows us to configure the destination and filename for the uploaded file (image).
/*const multerStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/img/users');
  },
  filename: (req, file, callback) => {
    const fileName = `user-${req.user._id}-${Date.now()}.${
      file.mimetype.split('/')[1]
    }`;
    callback(null, fileName);
  },
});
*/

// The image will be stored as a Buffer in memory
const multerStorage = multer.memoryStorage();

// This filter function makes sure that we can only allow files that are images to be uploaded to the server.
const multerFilter = (req, file, callback) => {
  // Test if the uploaded file is an image file and not any other type of files like csv, pdfs or videos.
  const acceptedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'tiff'];
  // if (!file.mimetype.startsWith('image')) {}
  if (!acceptedExtensions.includes(file.mimetype.split('/')[1])) {
    callback(new AppError('please provide a valid image file.', 400), false);
  } else {
    callback(null, true);
  }
};

// We then use the configured storage and the configured filter function to create the actual upload

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  // If we need to resize the uploaded image that the user uploads to the server, we need not to save the image to the disk first, but to store the image as buffer to memory and then resize the image while being stored in the memory as buffer before actually re-writing or saving the image back from the buffer in memory into a regular image file in the disk system.
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

exports.createUser = (req, res, next) => {
  res.status(400).json({
    message: 'This route is not defined, please use /signup instead.',
    status: 'error',
  });
};

exports.getUser = handlerFactory.getOne(User);

exports.getAllUsers = handlerFactory.getAll(User);

exports.updateUser = handlerFactory.updateOne(User);

exports.deleteUser = handlerFactory.deleteOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: 'success',
    message: 'user deleted successfully!',
    data: null,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (
    req.body.password ||
    req.body.oldPassword ||
    req.body.newPassword ||
    req.body.passwordConfirm
  ) {
    return next(
      new AppError(
        'you cannot update your password via this route, please use /users/updatePassword.',
        400
      )
    );
  }
  const filteredBody = filterObj(req.body, 'name', 'email');
  req.file && (filteredBody.photo = req.file.filename);
  const user = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    message: 'user data updated successfully.',
    data: {
      user,
    },
  });
});
