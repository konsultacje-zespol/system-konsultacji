import { useQuery } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '../api/http.js';
import { getErrorCode } from '../api/errors.js';
import ErrorState from '../components/ErrorState/ErrorState.jsx';
import { renderWithProviders } from './render-with-providers.jsx';

// EXAMPLE TEST — copy this file when you write a new one (see docs/tests.md, "Testy frontendu").

// STEP 1: replace the API module with a fake. Vitest moves vi.mock above the imports, so the
// component below gets the fake http instead of the real axios client — no request leaves the test.
vi.mock('../api/http.js', () => ({
  http: { get: vi.fn() },
}));

// A small component that exists only in this file: it loads GET /health and shows the status.
// In your test you import a real page or component instead.
async function getHealth() {
  const response = await http.get('/health');
  return response.data;
}

function HealthStatus() {
  const { t } = useTranslation();
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealth });

  if (healthQuery.isPending) {
    return <p>{t('common.loading')}</p>;
  }
  if (healthQuery.isError) {
    return <ErrorState code={getErrorCode(healthQuery.error)} onRetry={() => healthQuery.refetch()} />;
  }
  return <p>API: {healthQuery.data.status}</p>;
}

describe('example: HealthStatus', () => {
  beforeEach(() => {
    // forget the answers and calls set up by the previous test
    vi.mocked(http.get).mockReset();
  });

  it('shows the status returned by the API', async () => {
    // STEP 2: decide what the fake API returns (axios puts the response body in "data")
    vi.mocked(http.get).mockResolvedValue({ data: { status: 'ok' } });

    // STEP 3: render the component with TanStack Query and the router around it
    renderWithProviders(<HealthStatus />);

    // STEP 4: check what the user sees. The data arrives a moment later, so we use findByText,
    // which waits for the text (getByText checks only once, right now)
    expect(await screen.findByText('API: ok')).toBeInTheDocument();
    expect(http.get).toHaveBeenCalledWith('/health');
  });

  it('shows an error and loads again after clicking "Spróbuj ponownie"', async () => {
    // the first call fails, the second one succeeds
    vi.mocked(http.get)
      .mockRejectedValueOnce(new Error('Network down'))
      .mockResolvedValueOnce({ data: { status: 'ok' } });
    const user = userEvent.setup();

    renderWithProviders(<HealthStatus />);

    // the error box (ErrorState has role="alert") with the retry button appears
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    // STEP 5: click like a user does — find the button by its visible Polish text
    await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));

    expect(await screen.findByText('API: ok')).toBeInTheDocument();
    expect(http.get).toHaveBeenCalledTimes(2);
  });
});
