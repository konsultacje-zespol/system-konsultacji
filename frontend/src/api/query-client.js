import { QueryClient } from '@tanstack/react-query';

function shouldRetryQuery(failureCount, error) {
  const status = error.response ? error.response.status : null;

  // skip retries for 4xx client errors since repeating them won't change the outcome
  if (status >= 400 && status < 500) {
    return false;
  }

  return failureCount < 1;
}

// shared react query client instance with custom retry behavior
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
    },
  },
});