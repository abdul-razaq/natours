const reviewController = require('../controllers/reviewController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

const router = require('express').Router({ mergeParams: true });

router.use(authenticate);

router
  .route('/')
  .get(authenticate, reviewController.getAllReviews)
  .post(
    authenticate,
    authorize('user'),
    reviewController.setUserAndTourIDs,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authorize('user', 'admin'),
    authenticate,
    reviewController.updateReview
  )
  .delete(
    authorize('user', 'admin'),
    authenticate,
    reviewController.deleteReview
  );

module.exports = router;
