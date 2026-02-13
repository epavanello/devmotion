import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'devmotion_theme';

class ThemeStore {
  theme = $state<Theme>('system');
  resolvedTheme = $state<'light' | 'dark'>('light');

  constructor() {
    if (browser) {
      this.init();
    }
  }

  private init() {
    // Get stored preference or default to system
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    this.theme = stored || 'system';

    // Sync resolvedTheme with current DOM state (may have been set by inline script)
    const html = document.documentElement;
    this.resolvedTheme = html.classList.contains('dark') ? 'dark' : 'light';

    // Apply theme (handles 'system' preference and ensures consistency)
    this.applyTheme();
  }

  applyTheme() {
    let resolved: 'light' | 'dark';

    if (this.theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = this.theme;
    }

    this.resolvedTheme = resolved;

    // Apply/remove dark class on html element
    const html = document.documentElement;
    if (resolved === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  setTheme(theme: Theme) {
    this.theme = theme;
    if (browser) {
      localStorage.setItem(STORAGE_KEY, theme);
    }
    this.applyTheme();
  }

  toggle() {
    const newTheme = this.resolvedTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }
}

export const themeStore = new ThemeStore();
