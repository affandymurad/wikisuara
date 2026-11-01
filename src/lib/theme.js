/**
 * Theme manager for Wikisuara
 * Supports 'light' | 'dark' | 'system'
 */

const THEME_STORAGE_KEY = 'theme';

export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(theme) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

export function setTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors
  }
  applyTheme(theme);
}

export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);

  // Listen to system changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system');
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
  } else {
    mediaQuery.addListener(handler);
  }

  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handler);
    } else {
      mediaQuery.removeListener(handler);
    }
  };
}
