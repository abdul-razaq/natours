const express = require('express');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const tourController = require('../controllers/tourController');
const reviewRouter = require('../routes/reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);
// Whenever the tour routes encounters routes like '/:tourId/reviews' it should simply use the reviewRouter middleware.
router.use('/:tourId/reviews', reviewRouter);
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/top-5-best')
  .get(tourController.topFiveBestTours, tourController.getAllTours);
router
  .route('/top-5-cheapest')
  .get(tourController.topFiveCheapestTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/busiest-month/:year')
  .get(
    authenticate,
    authorize('admin', 'guide', 'lead-guide'),
    tourController.getBusiestMonth
  );

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authenticate,
    authorize('admin', 'lead-guide'),
    tourController.createTour
  );
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authenticate,
    authorize('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authenticate,
    authorize('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
