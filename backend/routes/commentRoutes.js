const express = require('express');
const { addComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/:postId', addComment);
router.delete('/:id', deleteComment);

module.exports = router;
