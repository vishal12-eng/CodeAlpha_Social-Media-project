const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const buildFollowResponse = (user) => ({
  _id: user._id,
  followersCount: user.followers.length,
  followingCount: user.following.length,
  followers: user.followers,
  following: user.following,
});

const followUser = asyncHandler(async (req, res) => {
  if (req.params.userId === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }

  const currentUser = await User.findById(req.user._id);
  const targetUser = await User.findById(req.params.userId);

  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const alreadyFollowing = currentUser.following.some(
    (id) => id.toString() === targetUser._id.toString()
  );

  if (alreadyFollowing) {
    return res.status(400).json({ message: 'You are already following this user' });
  }

  currentUser.following.push(targetUser._id);
  targetUser.followers.push(currentUser._id);

  targetUser.notifications.push({
    type: 'follow',
    message: `${req.user.name} started following you`,
    from: req.user._id,
  });

  await currentUser.save();
  await targetUser.save();

  return res.status(200).json({
    message: 'User followed successfully',
    currentUser: buildFollowResponse(currentUser),
    targetUser: buildFollowResponse(targetUser),
  });
});

const unfollowUser = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id);
  const targetUser = await User.findById(req.params.userId);

  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  currentUser.following = currentUser.following.filter(
    (id) => id.toString() !== targetUser._id.toString()
  );
  targetUser.followers = targetUser.followers.filter(
    (id) => id.toString() !== currentUser._id.toString()
  );

  await currentUser.save();
  await targetUser.save();

  return res.status(200).json({
    message: 'User unfollowed successfully',
    currentUser: buildFollowResponse(currentUser),
    targetUser: buildFollowResponse(targetUser),
  });
});

module.exports = {
  followUser,
  unfollowUser,
};
