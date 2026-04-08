const express = require('express');
const router  = express.Router();
const user    = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

// All user routes require authentication
router.use(protect);

// Watchlist (any logged-in user)
router.get('/me/watchlist',              user.getWatchlist);
router.post('/me/watchlist',             user.addToWatchlist);
router.delete('/me/watchlist/:mediaId',  user.removeFromWatchlist);

// Admin only
router.use(restrictTo('admin'));
router.get('/stats', user.getUserStats);
router.get('/',      user.getAllUsers);
router.get('/:id',   user.getUserById);
router.put('/:id',   user.updateUser);
router.delete('/:id', user.deleteUser);

module.exports = router;
