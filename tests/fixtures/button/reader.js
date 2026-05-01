document.addEventListener('click', event => {
  const button = event.target.closest('button[data-nav]');
  if (!button) return;
  window.location.assign(button.dataset.nav);
});
