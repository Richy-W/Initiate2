import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/apiClient';
import {
  DEFAULT_THEME_PREFERENCE,
  getStoredThemePreference,
  resolveThemePreference,
  setStoredThemePreference,
  ThemePreference,
} from '../utils/themePreference';

interface ThemeContextValue {
  theme: ThemePreference;
  isHydrated: boolean;
  setTheme: (theme: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [theme, setThemeState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
  const [isHydrated, setIsHydrated] = useState(false);

  const applyTheme = useCallback((nextTheme: ThemePreference) => {
    setThemeState(nextTheme);
    setStoredThemePreference(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  }, []);

  useEffect(() => {
    const fallbackTheme = getStoredThemePreference();
    applyTheme(fallbackTheme);
    setIsHydrated(true);
  }, [applyTheme]);

  useEffect(() => {
    if (!isHydrated || isLoading || !isAuthenticated) {
      return;
    }

    let isMounted = true;

    const hydrateFromProfile = async () => {
      try {
        const profile = await api.user.getProfile();
        const serverTheme = resolveThemePreference(profile?.theme_preference);
        if (isMounted) {
          applyTheme(serverTheme);
        }
      } catch {
        // Keep local fallback behavior when profile is unavailable.
      }
    };

    hydrateFromProfile();

    return () => {
      isMounted = false;
    };
  }, [applyTheme, isAuthenticated, isHydrated, isLoading]);

  const setTheme = useCallback(async (nextTheme: ThemePreference) => {
    applyTheme(nextTheme);

    if (!isAuthenticated) {
      return;
    }

    try {
      await api.user.updateProfile({ theme_preference: nextTheme });
    } catch {
      // Local storage remains the source of truth while server persistence is unavailable.
    }
  }, [applyTheme, isAuthenticated]);

  const toggleTheme = useCallback(async () => {
    const nextTheme: ThemePreference = theme === 'dark' ? 'tavern-light' : 'dark';
    await setTheme(nextTheme);
  }, [setTheme, theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    isHydrated,
    setTheme,
    toggleTheme,
  }), [isHydrated, setTheme, theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
