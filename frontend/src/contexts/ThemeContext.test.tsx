import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

const mockGetProfile = jest.fn();
const mockUpdateProfile = jest.fn();

let mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
};

jest.mock('./AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('../services/apiClient', () => ({
  api: {
    user: {
      getProfile: (...args: unknown[]) => mockGetProfile(...args),
      updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
    },
  },
}));

const ThemeConsumer: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <span data-testid="active-theme">{theme}</span>
      <button
        type="button"
        onClick={() => {
          void toggleTheme();
        }}
      >
        Toggle
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    mockAuthState = { isAuthenticated: false, isLoading: false };
    mockGetProfile.mockReset();
    mockUpdateProfile.mockReset();
  });

  test('applies tavern-light theme from local fallback state', async () => {
    localStorage.setItem('theme_preference', 'tavern-light');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-theme')).toHaveTextContent('tavern-light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('tavern-light');
    });
  });

  test('defaults to tavern-light for invalid stored preference', async () => {
    localStorage.setItem('theme_preference', 'legacy-theme');

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-theme')).toHaveTextContent('tavern-light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('tavern-light');
    });
  });

  test('hydrates signed-in users from account preference and persists toggle updates', async () => {
    mockAuthState = { isAuthenticated: true, isLoading: false };
    mockGetProfile.mockResolvedValue({ theme_preference: 'dark' });
    mockUpdateProfile.mockResolvedValue({});

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active-theme')).toHaveTextContent('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

    await waitFor(() => {
      expect(screen.getByTestId('active-theme')).toHaveTextContent('tavern-light');
      expect(mockUpdateProfile).toHaveBeenCalledWith({ theme_preference: 'tavern-light' });
    });
  });
});
