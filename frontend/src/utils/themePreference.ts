export type ThemePreference = 'dark' | 'tavern-light';

export const THEME_PREFERENCE_STORAGE_KEY = 'theme_preference';
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'tavern-light';

export const isThemePreference = (value: unknown): value is ThemePreference => {
  return value === 'dark' || value === 'tavern-light';
};

export const resolveThemePreference = (value: unknown): ThemePreference => {
  return isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE;
};

export const getStoredThemePreference = (): ThemePreference => {
  const stored = localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
  return resolveThemePreference(stored);
};

export const setStoredThemePreference = (theme: ThemePreference): void => {
  localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, theme);
};
