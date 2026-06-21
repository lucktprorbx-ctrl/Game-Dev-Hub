import React, { createContext, useContext, useEffect } from 'react';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import type { User } from '@workspace/api-client-react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe({ 
    query: { 
      queryKey: getGetMeQueryKey(),
      retry: false,
    } 
  });

  useEffect(() => {
    if (!isLoading && (isError || !user) && location !== '/login') {
      setLocation('/login');
    }
  }, [isLoading, isError, user, location, setLocation]);

  return (
    <AuthContext.Provider value={{
      user: user || null,
      isLoading,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
