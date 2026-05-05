const API_BASE_URL = `${window.location.origin}/api`;
const STORAGE_KEYS = {
  token: 'codealpha_social_token',
  user: 'codealpha_social_user',
};

const getToken = () => localStorage.getItem(STORAGE_KEYS.token);
const getStoredUser = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  return raw ? JSON.parse(raw) : null;
};

const setSession = (token, user) => {
  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
};

const showToast = (message, type = 'info') => {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    root.className = 'toast-root';
    document.body.appendChild(root);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  root.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
};

const setLoadingButton = (button, isLoading, loadingText = 'Please wait...') => {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = loadingText;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }
};

const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearSession();
    if (document.body.dataset.page !== 'login' && document.body.dataset.page !== 'register') {
      window.location.href = 'login.html';
    }
  }

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

const renderNavbar = () => {
  const root = document.getElementById('navbar-root');
  if (!root) return;

  const page = document.body.dataset.page || '';
  const user = getStoredUser();
  const activeClass = (target) => (page === target ? 'active' : '');

  root.innerHTML = `
    <header class="navbar">
      <div class="container nav-inner">
        <a class="brand" href="index.html">
          <span class="brand-mark">CA</span>
          <span>CodeAlpha SocialMedia</span>
        </a>
        <nav class="nav-links">
          <a class="${activeClass('home')}" href="index.html">Home</a>
          <a class="${activeClass('feed')}" href="feed.html">Feed</a>
          <a class="${activeClass('post')}" href="post.html">Create Post</a>
          <a class="${activeClass('profile')}" href="profile.html">Profile</a>
        </nav>
        <div class="nav-actions">
          ${
            user
              ? `
                <span>${user.name}</span>
                <button id="logout-button" type="button">Logout</button>
              `
              : `
                <a href="login.html">Login</a>
                <a class="btn btn-secondary" href="register.html">Register</a>
              `
          }
        </div>
      </div>
    </header>
  `;

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch (_error) {
        // Best-effort logout.
      }
      clearSession();
      showToast('Logged out successfully', 'success');
      window.location.href = 'login.html';
    });
  }
};

const renderFooter = () => {
  const root = document.getElementById('footer-root');
  if (!root) return;
  root.innerHTML = `
    <footer class="footer">
      <div class="container footer-inner">
        <span>CodeAlpha SocialMedia</span>
        <span>HTML, CSS, JavaScript, Express, MongoDB, JWT</span>
      </div>
    </footer>
  `;
};

const guardProtectedPage = () => {
  const protectedPages = ['profile', 'feed', 'post', 'user'];
  if (protectedPages.includes(document.body.dataset.page) && !getToken()) {
    showToast('Please login to continue', 'info');
    window.location.href = 'login.html';
  }
};

const bindLoginForm = () => {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      setLoadingButton(submitButton, true, 'Logging in...');
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSession(data.token, data.user);
      showToast('Login successful', 'success');
      window.location.href = 'feed.html';
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoadingButton(submitButton, false);
    }
  });
};

const bindRegisterForm = () => {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      setLoadingButton(submitButton, true, 'Creating account...');
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSession(data.token, data.user);
      showToast('Account created successfully', 'success');
      window.location.href = 'profile.html';
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoadingButton(submitButton, false);
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
  guardProtectedPage();
  bindLoginForm();
  bindRegisterForm();
});

window.App = {
  API_BASE_URL,
  getToken,
  getStoredUser,
  setSession,
  clearSession,
  request,
  showToast,
  setLoadingButton,
};
