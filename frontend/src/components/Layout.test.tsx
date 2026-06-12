import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Layout from './Layout';

const mockToggleTheme = jest.fn();
let mockTheme: 'dark' | 'tavern-light' = 'tavern-light';

jest.mock(
  'react-router-dom',
  () => ({
    __esModule: true,
    Outlet: () => null,
    Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useLocation: () => ({ pathname: '/dashboard' }),
  }),
  { virtual: true }
);

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { first_name: 'Theme', username: 'theme-user' },
    logout: jest.fn(),
  }),
}));

jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: mockTheme,
    isHydrated: true,
    toggleTheme: mockToggleTheme,
  }),
}));

describe('Layout theme toggle', () => {
  beforeEach(() => {
    mockToggleTheme.mockReset();
    mockTheme = 'tavern-light';
  });

  test('renders accessible theme toggle and calls toggle handler', () => {
    render(<Layout />);

    const toggle = screen.getByRole('button', {
      name: /toggle between dark and tavern-light theme/i,
    });

    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveTextContent(/switch to dark/i);

    fireEvent.click(toggle);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  test('renders dark-mode call-to-action when tavern-light is active', () => {
    render(<Layout />);

    expect(screen.getByText(/switch to dark/i)).toBeInTheDocument();
    expect(screen.getByText('TavernKeeper')).toBeInTheDocument();
  });

  test('renders tavern-light call-to-action when dark mode is active', () => {
    mockTheme = 'dark';

    render(<Layout />);

    expect(screen.getByText(/switch to tavern light/i)).toBeInTheDocument();
  });
});
