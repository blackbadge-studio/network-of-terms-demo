import {computed, ref, watch} from 'vue';

/**
 * Visual themes. The id is the `data-theme` attribute on <html>; the tokens and
 * layout variants live in src/index.css. `helder` is the baseline look.
 */
export const THEME_IDS = ['helder', 'mint', 'netwerk', 'minimaal'] as const;
export type ThemeId = typeof THEME_IDS[number];

export const THEME_STORAGE_KEY = 'vtn-theme';
export const DEFAULT_THEME: ThemeId = 'helder';

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);

const readStoredTheme = (): ThemeId => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(stored)) {
      return stored;
    }
  } catch {
    // Storage may be unavailable (private mode, blocked); fall through.
  }
  const fromDocument = document.documentElement.getAttribute('data-theme');
  return isThemeId(fromDocument) ? fromDocument : DEFAULT_THEME;
};

const theme = ref<ThemeId>(readStoredTheme());

export const applyTheme = (id: ThemeId) => {
  document.documentElement.setAttribute('data-theme', id);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // Not persisted; the choice still applies for this page view.
  }
};

applyTheme(theme.value);
watch(theme, applyTheme);

/** Shared reactive theme state for components that render a theme-specific layout. */
export const useTheme = () => ({
  theme,
  setTheme: (id: ThemeId) => { theme.value = id; },
  is: (id: ThemeId) => theme.value === id,
  isMinimal: computed(() => theme.value === 'minimaal'),
});
