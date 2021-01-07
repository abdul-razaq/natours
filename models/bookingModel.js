const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      required: [true, 'a booking must belong to a tour.'],
      ref: 'Tour',
    },
    user: {
      type: mongoose.Schema.ObjectId,
      required: [true, 'a booking must belong to a user.'],
      ref: 'User',
    },
    price: {
      type: Number,
      required: [true, 'a booking must have a price.'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    paid: {
      type: Boolean,
      default: true,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

bookingSchema.index({ user: 1, tour: 1 }, { unique: true });
bookingSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'tour',
    select: 'name',
  }).populate({
    path: 'user',
    select: 'name',
  });
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
