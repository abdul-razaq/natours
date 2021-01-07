const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authenticate, viewsController.getAccount);

router.post('/submit-user-data', authenticate, viewsController.updateUserData);

module.exports = router;
