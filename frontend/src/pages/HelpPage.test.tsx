import React from 'react';
import { render, screen } from '@testing-library/react';
import HelpPage from './HelpPage';

jest.mock(
  'react-router-dom',
  () => ({
    __esModule: true,
    MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }),
  { virtual: true }
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MemoryRouter } = require('react-router-dom');

describe('HelpPage branding', () => {
  test('shows TavernKeeper product name in overview copy', () => {
    render(
      <MemoryRouter>
        <HelpPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/TavernKeeper/i)).toBeInTheDocument();
    expect(screen.queryByText(/Welcome to\s+Initiate/i)).not.toBeInTheDocument();
  });
});
