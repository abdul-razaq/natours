const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

exports.setUserAndTourIDs = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.createReview = handlerFactory.createOne(Review);

exports.getReview = handlerFactory.getOne(Review);

exports.updateReview = handlerFactory.updateOne(Review);

exports.deleteReview = handlerFactory.deleteOne(Review);

exports.getAllReviews = handlerFactory.getAll(Review);
