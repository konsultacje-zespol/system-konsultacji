import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // staleTime: Infinity — we do not refetch /auth/me in the background.
  // after login we write the user with setQueryData; after logout we clear the cache.
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: Infinity,
  });

  const value = {
    user: meQuery.data ?? null,
    isLoading: meQuery.isPending,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
