const User = require('../models/User');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');

const mapUserProfile = (user, viewerId = null) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profilePic: user.profilePic,
  bio: user.bio,
  followersCount: user.followers.length,
  followingCount: user.following.length,
  followers: user.followers,
  following: user.following,
  isFollowing: viewerId ? user.followers.some((id) => id.toString() === viewerId.toString()) : false,
  notifications: user.notifications
    .slice(-8)
    .reverse()
    .map((item) => ({
      type: item.type,
      message: item.message,
      createdAt: item.createdAt,
      from: item.from,
      postId: item.postId,
    })),
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('followers', 'name profilePic')
    .populate('following', 'name profilePic')
    .populate('notifications.from', 'name profilePic');

  return res.status(200).json(mapUserProfile(user, req.user._id));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, profilePic } = req.body;
  const user = await User.findById(req.user._id);

  if (name !== undefined) {
    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }
    if (name.trim().length > 60) {
      return res.status(400).json({ message: 'Name cannot exceed 60 characters' });
    }
    user.name = name.trim();
  }
  if (bio !== undefined) {
    if (bio.trim().length > 280) {
      return res.status(400).json({ message: 'Bio cannot exceed 280 characters' });
    }
    user.bio = bio.trim();
  }
  if (profilePic !== undefined) {
    // Basic URL validation
    const urlPattern = /^(http|https):\/\/[^ "]+$/;
    if (profilePic.trim() !== '' && !urlPattern.test(profilePic.trim())) {
      return res.status(400).json({ message: 'Profile picture must be a valid URL' });
    }
    user.profilePic = profilePic.trim();
  }

  await user.save();

  const updatedUser = await User.findById(req.user._id)
    .populate('followers', 'name profilePic')
    .populate('following', 'name profilePic')
    .populate('notifications.from', 'name profilePic');

  return res.status(200).json({
    message: 'Profile updated successfully',
    user: mapUserProfile(updatedUser, req.user._id),
  });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('followers', 'name profilePic')
    .populate('following', 'name profilePic')
    .populate('notifications.from', 'name profilePic');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const posts = await Post.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .populate('userId', 'name profilePic');

  return res.status(200).json({
    user: mapUserProfile(user, req.user._id),
    posts,
  });
});

const searchUsers = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;
  const users = await User.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ],
  })
    .select('name email profilePic bio followers following')
    .limit(10);

  return res.status(200).json(
    users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    }))
  );
});

const getSuggestedUsers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const excludeIds = [req.user._id, ...user.following];

  const suggestedUsers = await User.find({ _id: { $nin: excludeIds } })
    .select('name email profilePic bio followers following')
    .sort({ createdAt: -1 })
    .limit(5);

  return res.status(200).json(
    suggestedUsers.map((person) => ({
      _id: person._id,
      name: person.name,
      email: person.email,
      profilePic: person.profilePic,
      bio: person.bio,
      followersCount: person.followers.length,
      followingCount: person.following.length,
    }))
  );
});

module.exports = {
  getProfile,
  updateProfile,
  getUserProfile,
  searchUsers,
  getSuggestedUsers,
};
