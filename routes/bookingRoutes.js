const bookingController = require('../controllers/bookingController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

const router = require('express').Router();

router.use(authenticate);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authorize('admin', 'lead-guide'));

router
  .route('/')
  .post(authenticate, authorize('admin'), bookingController.createBooking)
  .get(authenticate, authorize('admin'), bookingController.getAllBookings);

router
  .route('/:id')
  .get(authenticate, authorize('admin'), bookingController.getBooking)
  .patch(authenticate, authorize('admin'), bookingController.updateBooking)
  .delete(authenticate, authorize('admin'), bookingController.deleteBooking);

module.exports = router;
