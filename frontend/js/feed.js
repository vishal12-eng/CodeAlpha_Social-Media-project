document.addEventListener('DOMContentLoaded', () => {
  loadLatestPreview();
  if (document.body.dataset.page === 'feed') {
    initializeFeedPage();
  }
  if (document.body.dataset.page === 'user') {
    loadUserProfilePage();
  }
});

async function loadLatestPreview() {
  const root = document.getElementById('latest-posts-root');
  if (!root) return;

  try {
    const posts = App.getToken() ? await App.request('/posts') : [];
    root.innerHTML = posts.length
      ? posts.slice(0, 3).map(renderPostCard).join('')
      : `<div class="empty-state">Login to explore posts from the community.</div>`;
    attachPostEvents(root);
  } catch (error) {
    root.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

async function initializeFeedPage() {
  bindFeedButtons();
  bindSearchForm();
  await Promise.all([loadHomeFeed(), loadTrendingPosts(), loadSuggestedUsers()]);
}

function bindFeedButtons() {
  const homeButton = document.getElementById('load-home-feed');
  const latestButton = document.getElementById('load-latest-posts');

  if (homeButton) homeButton.addEventListener('click', loadHomeFeed);
  if (latestButton) latestButton.addEventListener('click', loadAllPosts);
}

async function loadHomeFeed() {
  await loadPostsIntoRoot('/posts/feed/home', 'No posts from followed users yet.');
}

async function loadAllPosts() {
  await loadPostsIntoRoot('/posts', 'No posts available yet.');
}

async function loadPostsIntoRoot(endpoint, emptyMessage) {
  const root = document.getElementById('feed-root');
  if (!root) return;

  root.innerHTML = `<div class="empty-state">Loading posts...</div>`;

  try {
    const posts = await App.request(endpoint);
    root.innerHTML = posts.length
      ? posts.map(renderPostCard).join('')
      : `<div class="empty-state">${emptyMessage}</div>`;
    attachPostEvents(root);
  } catch (error) {
    root.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

async function loadTrendingPosts() {
  const root = document.getElementById('trending-root');
  if (!root) return;

  try {
    const posts = await App.request('/posts/trending/list');
    root.innerHTML = posts.length
      ? posts
          .map(
            (post) => `
              <div class="trend-card">
                <strong>${post.userId.name}</strong>
                <p>${truncate(post.content, 110)}</p>
                <small>${post.likes.length} likes</small>
              </div>
            `
          )
          .join('')
      : `<div class="empty-state">No trending posts yet.</div>`;
  } catch (error) {
    root.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

async function loadSuggestedUsers() {
  const root = document.getElementById('suggested-users-root');
  if (!root) return;

  try {
    const users = await App.request('/users/suggested');
    root.innerHTML = users.length
      ? users
          .map(
            (user) => `
              <div class="suggestion-card">
                <div class="list-row">
                  <img class="avatar-sm" src="${user.profilePic}" alt="${user.name}" />
                  <div>
                    <strong>${user.name}</strong>
                    <p>${truncate(user.bio, 60)}</p>
                  </div>
                </div>
                <div class="feed-actions">
                  <a class="btn btn-secondary" href="user.html?id=${user._id}">View</a>
                  <button class="btn btn-primary" data-follow-id="${user._id}" type="button">Follow</button>
                </div>
              </div>
            `
          )
          .join('')
      : `<div class="empty-state">No suggestions right now.</div>`;

    root.querySelectorAll('[data-follow-id]').forEach((button) => {
      button.addEventListener('click', async () => {
        await followUser(button.dataset.followId);
      });
    });
  } catch (error) {
    root.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

function bindSearchForm() {
  const form = document.getElementById('search-form');
  const input = document.getElementById('user-search-input');
  const root = document.getElementById('search-results-root');
  if (!form || !input || !root) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = input.value.trim();

    if (!query) {
      root.innerHTML = `<div class="empty-state">Enter a name or email to search.</div>`;
      return;
    }

    root.innerHTML = `<div class="empty-state">Searching users...</div>`;

    try {
      const users = await App.request(`/users/search?q=${encodeURIComponent(query)}`);
      root.innerHTML = users.length
        ? users
            .map(
              (user) => `
                <div class="search-user">
                  <img class="avatar-sm" src="${user.profilePic}" alt="${user.name}" />
                  <div>
                    <strong>${user.name}</strong>
                    <p>${user.email}</p>
                  </div>
                  <a class="btn btn-secondary" href="user.html?id=${user._id}">Open</a>
                </div>
              `
            )
            .join('')
        : `<div class="empty-state">No users found.</div>`;
    } catch (error) {
      root.innerHTML = `<div class="empty-state">${error.message}</div>`;
    }
  });
}

function renderPostCard(post) {
  const currentUser = App.getStoredUser();
  const likedByMe = currentUser
    ? post.likes.some((id) => (typeof id === 'string' ? id : id._id) === currentUser._id)
    : false;
  
  const postUser = post.userId || { _id: '', name: 'Unknown User', profilePic: 'https://via.placeholder.com/50' };
  const isOwner = currentUser && postUser._id === currentUser._id;

  return `
    <article class="post-card" data-post-id="${post._id}">
      <div class="post-head">
        <img class="avatar-sm" src="${postUser.profilePic}" alt="${postUser.name}" onerror="this.src='https://via.placeholder.com/50'" />
        <div class="stack compact">
          <strong><a href="user.html?id=${postUser._id}">${postUser.name}</a></strong>
          <small class="muted-text">${new Date(post.createdAt).toLocaleString()}</small>
        </div>
      </div>
      ${post.image ? `<img class="post-image" src="${post.image}" alt="Post image" onerror="this.style.display='none'" />` : ''}
      <div class="post-body">
        <p class="post-text">${escapeHtml(post.content)}</p>
        <div class="post-meta">
          <span>${post.likes.length} likes</span>
          <span>${post.comments.length} comments</span>
        </div>
        <div class="post-actions">
          <button class="btn btn-secondary" data-like-id="${post._id}" type="button">
            ${likedByMe ? 'Unlike' : 'Like'}
          </button>
          ${
            isOwner
              ? `
                <button class="btn btn-secondary" data-edit-id="${post._id}" type="button">Edit</button>
                <button class="btn btn-danger" data-delete-id="${post._id}" type="button">Delete</button>
              `
              : ''
          }
        </div>
        <form class="comment-form stack compact" data-comment-form="${post._id}">
          <input type="text" name="text" placeholder="Write a comment..." required />
          <button class="btn btn-primary" type="submit">Comment</button>
        </form>
        <div class="comment-list">
          ${post.comments
            .map((comment) => {
              const commentUser = comment.userId || { _id: '', name: 'Unknown', profilePic: 'https://via.placeholder.com/50' };
              return `
                <div class="comment-item">
                  <img class="avatar-sm" src="${commentUser.profilePic}" alt="${commentUser.name}" onerror="this.src='https://via.placeholder.com/50'" />
                  <div class="stack compact">
                    <strong>${commentUser.name}</strong>
                    <span>${escapeHtml(comment.text)}</span>
                    <small class="muted-text">${new Date(comment.createdAt).toLocaleString()}</small>
                  </div>
                  ${
                    currentUser &&
                    (commentUser._id === currentUser._id || postUser._id === currentUser._id)
                      ? `<button class="btn btn-danger" data-delete-comment-id="${comment._id}" type="button">Delete</button>`
                      : ''
                  }
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    </article>
  `;
}

function attachPostEvents(root) {
  root.querySelectorAll('[data-like-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await App.request(`/posts/like/${button.dataset.likeId}`, { method: 'PUT' });
        await reloadCurrentFeed();
      } catch (error) {
        App.showToast(error.message, 'error');
      }
    });
  });

  root.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await App.request(`/posts/${button.dataset.deleteId}`, { method: 'DELETE' });
        App.showToast('Post deleted', 'success');
        await reloadCurrentFeed();
      } catch (error) {
        App.showToast(error.message, 'error');
      }
    });
  });

  root.querySelectorAll('[data-edit-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const card = button.closest('[data-post-id]');
      const currentText = card.querySelector('.post-text').textContent;
      const nextText = window.prompt('Edit your post', currentText);
      if (nextText === null) return;

      try {
        await App.request(`/posts/${button.dataset.editId}`, {
          method: 'PUT',
          body: JSON.stringify({ content: nextText, image: card.querySelector('.post-image')?.src || '' }),
        });
        App.showToast('Post updated', 'success');
        await reloadCurrentFeed();
      } catch (error) {
        App.showToast(error.message, 'error');
      }
    });
  });

  root.querySelectorAll('[data-comment-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const postId = form.dataset.commentForm;
      const input = form.querySelector('input[name="text"]');

      try {
        await App.request(`/comments/${postId}`, {
          method: 'POST',
          body: JSON.stringify({ text: input.value }),
        });
        input.value = '';
        await reloadCurrentFeed();
      } catch (error) {
        App.showToast(error.message, 'error');
      }
    });
  });

  root.querySelectorAll('[data-delete-comment-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await App.request(`/comments/${button.dataset.deleteCommentId}`, { method: 'DELETE' });
        App.showToast('Comment deleted', 'success');
        await reloadCurrentFeed();
      } catch (error) {
        App.showToast(error.message, 'error');
      }
    });
  });
}

async function reloadCurrentFeed() {
  if (document.body.dataset.page === 'feed') {
    await loadHomeFeed();
    await Promise.all([loadTrendingPosts(), loadSuggestedUsers()]);
  } else if (document.body.dataset.page === 'user') {
    await loadUserProfilePage();
  } else {
    await loadLatestPreview();
  }
}

async function followUser(userId, isFollowing = false) {
  try {
    await App.request(isFollowing ? `/unfollow/${userId}` : `/follow/${userId}`, {
      method: 'PUT',
    });
    App.showToast(isFollowing ? 'User unfollowed' : 'User followed', 'success');
    await Promise.all([loadSuggestedUsers(), loadHomeFeed()]);
    if (document.body.dataset.page === 'user') {
      await loadUserProfilePage();
    }
  } catch (error) {
    App.showToast(error.message, 'error');
  }
}

async function loadUserProfilePage() {
  const root = document.getElementById('user-profile-root');
  if (!root) return;

  const userId = new URLSearchParams(window.location.search).get('id');
  if (!userId) {
    root.innerHTML = `<div class="empty-state">Missing user ID.</div>`;
    return;
  }

  root.innerHTML = `<div class="empty-state">Loading profile...</div>`;

  try {
    const data = await App.request(`/users/${userId}`);
    root.innerHTML = `
      <section class="user-hero">
        <div class="profile-banner">
          <img class="avatar" src="${data.user.profilePic}" alt="${data.user.name}" />
          <div class="stack compact">
            <div>
              <span class="eyebrow">User profile</span>
              <h1>${data.user.name}</h1>
              <p class="muted-text">${data.user.email}</p>
            </div>
            <p>${data.user.bio}</p>
            <div class="stats-row">
              <span class="stat-pill">${data.user.followersCount} followers</span>
              <span class="stat-pill">${data.user.followingCount} following</span>
            </div>
            <div>
              <button
                class="btn ${data.user.isFollowing ? 'btn-secondary' : 'btn-primary'}"
                id="user-follow-toggle"
                type="button"
              >
                ${data.user.isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            </div>
          </div>
        </div>
      </section>
      <section class="stack">
        ${data.posts.length ? data.posts.map(renderPostCard).join('') : `<div class="empty-state">No posts yet.</div>`}
      </section>
    `;

    document.getElementById('user-follow-toggle').addEventListener('click', async () => {
      await followUser(userId, data.user.isFollowing);
    });

    attachPostEvents(root);
  } catch (error) {
    root.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

function truncate(text, length) {
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
