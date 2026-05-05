const express = require('express');
const {
  getProfile,
  updateProfile,
  getUserProfile,
  searchUsers,
  getSuggestedUsers,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/search', searchUsers);
router.get('/suggested', getSuggestedUsers);
router.get('/:id', getUserProfile);

module.exports = router;
