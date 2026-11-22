import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RequireRole from './RequireRole.jsx';

// STEP 1: replace useAuth with a fake. Vitest moves vi.mock above the imports,
// so RequireRole gets this fake instead of the real AuthProvider.
vi.mock('./AuthProvider.jsx', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from './AuthProvider.jsx';

function renderRequireRole(authValue, initialPath) {
  // STEP 2: tell the fake what the current user is (or null)
  vi.mocked(useAuth).mockReturnValue(authValue);

  // STEP 3: build a tiny router in memory (no real browser URL)
  const router = createMemoryRouter(
    [
      { path: '/login', element: <div>login page</div> },
      { path: '/403', element: <div>403 page</div> },
      {
        element: <RequireRole role="LECTURER" />,
        children: [{ path: '/lecturer/schedule', element: <div>lecturer schedule</div> }],
      },
    ],
    { initialEntries: [initialPath] },
  );

  return render(<RouterProvider router={router} />);
}

describe('RequireRole', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReset();
  });

  it('sends a guest to /login', () => {
    // no user, not loading
    renderRequireRole({ user: null, isLoading: false }, '/lecturer/schedule');

    // STEP 4: the guest sees the login page, not the lecturer schedule
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('lecturer schedule')).not.toBeInTheDocument();
  });

  it('sends a student on a lecturer route to /403', () => {
    renderRequireRole(
      {
        user: { id: '1', role: 'STUDENT', firstName: 'Anna', lastName: 'Nowak' },
        isLoading: false,
      },
      '/lecturer/schedule',
    );

    expect(screen.getByText('403 page')).toBeInTheDocument();
    expect(screen.queryByText('lecturer schedule')).not.toBeInTheDocument();
  });

  it('shows the child page when the role matches', () => {
    renderRequireRole(
      {
        user: { id: '2', role: 'LECTURER', firstName: 'Jan', lastName: 'Kowalski', title: 'dr' },
        isLoading: false,
      },
      '/lecturer/schedule',
    );

    expect(screen.getByText('lecturer schedule')).toBeInTheDocument();
  });
});
