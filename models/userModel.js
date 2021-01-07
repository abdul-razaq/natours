const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name.'],
      maxlength: [50, 'name should not be more than 50 characters'],
      minlength: [3, 'name must be more than 3 characters!'],
      // validate: [
      //   validator.isAlpha(value),
      //   'name must contain only Alphanumeric characters.',
      // ],
    },
    email: {
      type: String,
      required: [true, 'An email address is required.'],
      unique: true,
      maxlength: [50, 'email address must not be more than 50 characters.'],
      minlength: [5, 'email address cannot be less than 5 characters.'],
      lowercase: true,
      // validate: [
      //   validator.isEmail(value),
      //   'input must be a valid email address',
      // ],
    },
    photo: { type: String, default: 'default.jpg' },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'password is a required field'],
      maxlength: [50, 'password must not be more than 50 characters.'],
      minlength: [8, 'password must not be less than 8 characters'],
      select: false,
      // validate: [
      //   validator.isAlpha('<DUMMY>'),
      //   'password must contain only alphanumeric characters',
      // ],
    },
    passwordConfirm: {
      type: String,
      required: [true, 'please confirm your password'],
      validate: {
        // This validation logic will only work on saving documents and not when updating them.
        // So when we want to update our users, we have to use 'save'... i.e .save() or .create() instead of using methods that will not trigger this validator like findOneAndUpdate or findByIdAndUpdate to update documents.
        validator: function (value) {
          return this.password === value;
        },
        message: 'passwords must have to match!',
      },
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.verifyPassword = async function (password, hash) {
  return await bcrypt.compare(password, hash);
};

userSchema.methods.hasPasswordChanged = function (JWTIssuedAtTime) {
  let convertedPasswordChangedAt;
  if (this.passwordChangedAt) {
    convertedPasswordChangedAt = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
  }
  return JWTIssuedAtTime < convertedPasswordChangedAt;
};

userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
