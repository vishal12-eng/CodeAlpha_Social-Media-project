document.addEventListener('DOMContentLoaded', () => {
  loadMyProfile();
  bindProfileForm();
});

async function loadMyProfile() {
  const profileRoot = document.getElementById('my-profile-root');
  const notificationsRoot = document.getElementById('notifications-root');
  const form = document.getElementById('profile-form');
  if (!profileRoot || !notificationsRoot || !form) return;

  try {
    const profile = await App.request('/users/profile');
    App.setSession(App.getToken(), {
      _id: profile._id,
      name: profile.name,
      email: profile.email,
      profilePic: profile.profilePic,
      bio: profile.bio,
    });

    form.name.value = profile.name || '';
    form.profilePic.value = profile.profilePic || '';
    form.bio.value = profile.bio || '';

    profileRoot.innerHTML = `
      <div class="profile-banner">
        <img class="avatar" src="${profile.profilePic}" alt="${profile.name}" onerror="this.src='https://via.placeholder.com/150'" />
        <div class="stack compact">
          <div>
            <span class="eyebrow">My profile</span>
            <h1>${profile.name}</h1>
            <p class="muted-text">${profile.email}</p>
          </div>
          <p>${profile.bio}</p>
          <div class="stats-row">
            <span class="stat-pill">${profile.followersCount} followers</span>
            <span class="stat-pill">${profile.followingCount} following</span>
          </div>
          <div class="stack compact">
            <strong>Followers</strong>
            ${renderPeopleList(profile.followers)}
            <strong>Following</strong>
            ${renderPeopleList(profile.following)}
          </div>
        </div>
      </div>
    `;

    notificationsRoot.innerHTML = profile.notifications.length
      ? profile.notifications
          .map(
            (item) => `
              <div class="notification-item">
                <strong>${item.type.toUpperCase()}</strong>
                <div>${item.message}</div>
                <small>${new Date(item.createdAt).toLocaleString()}</small>
              </div>
            `
          )
          .join('')
      : `<div class="empty-state">No notifications yet.</div>`;
  } catch (error) {
    profileRoot.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

function renderPeopleList(people) {
  if (!people || !people.length) {
    return `<div class="empty-state">No users yet.</div>`;
  }

  return people
    .map(
      (person) => `
        <a class="follower-pill" href="user.html?id=${person._id}">
          ${person.name}
        </a>
      `
    )
    .join('');
}

function bindProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      App.setLoadingButton(submitButton, true, 'Saving...');
      const data = await App.request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      App.setSession(App.getToken(), {
        _id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        profilePic: data.user.profilePic,
        bio: data.user.bio,
      });
      App.showToast('Profile updated successfully', 'success');
      loadMyProfile();
    } catch (error) {
      App.showToast(error.message, 'error');
    } finally {
      App.setLoadingButton(submitButton, false);
    }
  });
}
