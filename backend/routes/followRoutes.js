const express = require('express');
const { followUser, unfollowUser } = require('../controllers/followController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.put('/follow/:userId', followUser);
router.put('/unfollow/:userId', unfollowUser);

module.exports = router;
