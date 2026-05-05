const express = require('express');
const {
  createPost,
  getAllPosts,
  getFeed,
  getTrendingPosts,
  updatePost,
  deletePost,
  toggleLikePost,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getAllPosts);
router.get('/feed/home', getFeed);
router.get('/trending/list', getTrendingPosts);
router.post('/', createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);
router.put('/like/:id', toggleLikePost);

module.exports = router;
