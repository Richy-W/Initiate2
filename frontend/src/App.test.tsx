import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';

jest.mock(
  'react-router-dom',
  () => ({
    __esModule: true,
    MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Outlet: () => null,
    Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useLocation: () => ({ pathname: '/dashboard' }),
    useNavigate: () => jest.fn(),
  }),
  { virtual: true }
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MemoryRouter } = require('react-router-dom');

jest.mock('./contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { first_name: 'Test', username: 'tester' },
    logout: jest.fn(),
  }),
}));

jest.mock('./contexts/NotificationContext', () => ({
  useNotification: () => ({
    notifyError: jest.fn(),
    notifySuccess: jest.fn(),
    notifyInfo: jest.fn(),
  }),
}));

jest.mock('./contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'tavern-light',
    isHydrated: true,
    toggleTheme: jest.fn(),
  }),
}));

describe('US1 branding smoke checks', () => {
  test('layout shows TavernKeeper brand title', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByText('TavernKeeper')).toBeInTheDocument();
  });

  test('login page shows TavernKeeper platform kicker', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/TavernKeeper Platform/i)).toBeInTheDocument();
  });
});
