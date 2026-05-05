const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const { postId } = req.params;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Comment text is required' });
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const comment = await Comment.create({
    postId,
    userId: req.user._id,
    text: text.trim(),
  });

  post.comments.push(comment._id);
  await post.save();

  if (post.userId.toString() !== req.user._id.toString()) {
    await User.findByIdAndUpdate(post.userId, {
      $push: {
        notifications: {
          type: 'comment',
          message: `${req.user.name} commented on your post`,
          from: req.user._id,
          postId: post._id,
        },
      },
    });
  }

  const populatedComment = await Comment.findById(comment._id).populate('userId', 'name profilePic');

  return res.status(201).json({
    message: 'Comment added successfully',
    comment: populatedComment,
  });
});

const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  const post = await Post.findById(comment.postId);
  const canDelete =
    comment.userId.toString() === req.user._id.toString() ||
    (post && post.userId.toString() === req.user._id.toString());

  if (!canDelete) {
    return res.status(403).json({ message: 'You are not allowed to delete this comment' });
  }

  await Post.findByIdAndUpdate(comment.postId, {
    $pull: { comments: comment._id },
  });
  await Comment.findByIdAndDelete(comment._id);

  return res.status(200).json({ message: 'Comment deleted successfully' });
});

module.exports = {
  addComment,
  deleteComment,
};
