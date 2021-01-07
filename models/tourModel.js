const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have less than or equal to 40 characters',
      ],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
      // validate: [
      //   validator.isAlpha,
      //   'Tour name must only contain alphabet characters',
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty value must be one of: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5, 'Rating must be below 5.0'],
      min: [1, 'Rating must be above 1.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // the 'this' keyword here only points to the current doc on saving NEW Document only and not on UPDATING them.
          return this.price > val;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    // embedded documents are simply an array of document objects.
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Single Index (One Field to Index)
// tourSchema.index({ price: 1 });
// Compound Index (Two or more field to use as index field)
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// With Virtual Populate, we want the parent of the child to be aware of its children, so that we can then populate its children alongside the parent when we query for the parent of this children.
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE: It runs before .save() and .create() command but not on insertMany().
// 'save' event is always the event for the document middleware.
// 'save' document middleware works only for save and create but not for update!
tourSchema.pre('save', function (next) {
  // In a 'pre-save' middleware, the 'this' keyword is going to point to the currently processed document.
  // Here we have access to the document that is currently being processed and about to be saved.
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function(next) {
//   console.log('Will soon save document...');
//   next();
// });

// Post-Middleware functions are executed only after all the Pre-Middleware functions have been executed, and they usually accept the document that just got saved. We no longer have the 'this' keyword but only the finished document. We can also have multiple 'pre' and 'post' middlewares for the same hook!
// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// })

// Because findOneAndUpdate/findByIdAndUpdate causes a document to be saved does not mean that they are document middlewares/hooks and the 'save' hook will not be triggered/executed coz of them!
// However we can have workarounds for this limitation.

// QUERY MIDDLEWARE
// allows us to define functions that run before or after certain queries are executed.
tourSchema.pre(/^find/, function (next) {
  // In a Query middleware (^find) we are not processing the current document but the current query.
  this.find({ secretTour: { $ne: true } });
  // this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -secretTour',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  // Here we have access to all the documents that are returned by the query object
  // console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  // console.log(docs);
  next();
});

// AGGREGATE MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

module.exports = mongoose.model('Tour', tourSchema);
