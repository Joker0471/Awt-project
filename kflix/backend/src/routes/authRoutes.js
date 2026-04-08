const express = require('express');
const router  = express.Router();
const auth    = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public
router.post('/signup',  auth.signup);
router.post('/login',   auth.login);
router.post('/refresh', auth.refresh);

// Protected
router.use(protect);
router.get('/me',              auth.getMe);
router.post('/logout',         auth.logout);
router.put('/change-password', auth.changePassword);

module.exports = router;
