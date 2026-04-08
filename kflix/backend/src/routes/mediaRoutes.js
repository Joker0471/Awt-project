const express = require('express');
const router  = express.Router();
const media   = require('../controllers/mediaController');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');

// Public — browse media without login (optionalAuth attaches req.user if logged in)
router.get('/',        optionalAuth, media.getAllMedia);
router.get('/grouped', media.getGrouped);
router.get('/:id',     media.getMediaById);

// Admin only
router.use(protect, restrictTo('admin'));
router.post('/',    media.createMedia);
router.put('/:id',  media.updateMedia);
router.delete('/:id', media.deleteMedia);

module.exports = router;
