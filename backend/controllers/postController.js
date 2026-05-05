const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const asyncHandler = require('../utils/asyncHandler');

const populatePosts = (query) =>
  query
    .populate('userId', 'name profilePic')
    .populate({
      path: 'comments',
      populate: {
        path: 'userId',
        select: 'name profilePic',
      },
    });

const createPost = asyncHandler(async (req, res) => {
  const { content, image = '' } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Post content is required' });
  }

  const post = await Post.create({
    userId: req.user._id,
    content: content.trim(),
    image: image.trim(),
  });

  const createdPost = await populatePosts(Post.findById(post._id));
  return res.status(201).json({
    message: 'Post created successfully',
    post: createdPost,
  });
});

const getAllPosts = asyncHandler(async (_req, res) => {
  const posts = await populatePosts(Post.find().sort({ createdAt: -1 }).limit(50));
  return res.status(200).json(posts);
});

const getFeed = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id);
  const followingIds = currentUser.following || [];

  const posts = await populatePosts(
    Post.find({
      $or: [{ userId: req.user._id }, { userId: { $in: followingIds } }],
    }).sort({ createdAt: -1 }).limit(50)
  );

  return res.status(200).json(posts);
});

const getTrendingPosts = asyncHandler(async (_req, res) => {
  const posts = await populatePosts(Post.find().sort({ likes: -1, createdAt: -1 }).limit(5));
  return res.status(200).json(posts);
});

const updatePost = asyncHandler(async (req, res) => {
  const { content, image = '' } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (post.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only edit your own posts' });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Post content is required' });
  }

  post.content = content.trim();
  post.image = image.trim();
  await post.save();

  const updatedPost = await populatePosts(Post.findById(post._id));
  return res.status(200).json({
    message: 'Post updated successfully',
    post: updatedPost,
  });
});

const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (post.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only delete your own posts' });
  }

  await Comment.deleteMany({ postId: post._id });
  await Post.findByIdAndDelete(post._id);

  return res.status(200).json({ message: 'Post deleted successfully' });
});

const toggleLikePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const alreadyLiked = post.likes.some((id) => id.toString() === req.user._id.toString());
  let message = 'Post liked';

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
    message = 'Post unliked';
  } else {
    post.likes.push(req.user._id);

    if (post.userId.toString() !== req.user._id.toString()) {
      await User.findByIdAndUpdate(post.userId, {
        $push: {
          notifications: {
            type: 'like',
            message: `${req.user.name} liked your post`,
            from: req.user._id,
            postId: post._id,
          },
        },
      });
    }
  }

  await post.save();

  const updatedPost = await populatePosts(Post.findById(post._id));
  return res.status(200).json({
    message,
    post: updatedPost,
  });
});

module.exports = {
  createPost,
  getAllPosts,
  getFeed,
  getTrendingPosts,
  updatePost,
  deletePost,
  toggleLikePost,
};
