import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// renders a component with everything the app gives it in main.jsx: TanStack Query and the router.
// route — the address the component "sees", e.g. '/student/bookings'
export function renderWithProviders(ui, { route = '/' } = {}) {
  // a new client in every test, so cached data from one test never leaks into the next.
  // retry: false — a failed request shows the error at once instead of being repeated
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}
