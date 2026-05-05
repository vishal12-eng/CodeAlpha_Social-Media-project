document.addEventListener('DOMContentLoaded', () => {
  bindCreatePostForm();
});

function bindCreatePostForm() {
  const form = document.getElementById('create-post-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      App.setLoadingButton(submitButton, true, 'Publishing...');
      await App.request('/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      App.showToast('Post created successfully', 'success');
      form.reset();
      window.location.href = 'feed.html';
    } catch (error) {
      App.showToast(error.message, 'error');
    } finally {
      App.setLoadingButton(submitButton, false);
    }
  });
}
