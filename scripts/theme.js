// Theme management functionality
function initTheme() {
  // Check for saved theme preference or default to system preference
  const savedTheme = localStorage.getItem('theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const currentTheme = savedTheme || systemTheme;

  // Apply the theme
  setTheme(currentTheme);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
          setTheme(e.matches ? 'dark' : 'light');
      }
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  // Update button icon if it exists
  const themeIcon = document.querySelector('.theme-toggle img');
  if (themeIcon) {
      themeIcon.src = theme === 'dark' ? '/icons/sun.svg' : '/icons/moon.svg';
      themeIcon.alt = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

export { initTheme, toggleTheme };