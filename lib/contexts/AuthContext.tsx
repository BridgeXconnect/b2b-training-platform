'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, LoginCredentials, AuthResponse, apiClient } from '../api-client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if we have a token
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        
        if (token) {
          // Verify token by fetching current user
          const currentUser = await apiClient.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid tokens
        apiClient.clearAuthTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      const authResponse: AuthResponse = await apiClient.login(credentials);
      
      // Store tokens
      apiClient.setAuthTokens(authResponse.access_token, authResponse.refresh_token);
      
      // Set user
      setUser(authResponse.user);
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call API logout endpoint
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local state regardless of API call result
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setError(null);
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
    } catch (error: any) {
      console.error('Refresh user error:', error);
      setError(error.message || 'Failed to refresh user data');
      
      // If refresh fails due to auth issues, logout
      if (error.status === 401) {
        await logout();
      }
    }
  }, [isAuthenticated, logout]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Higher-order component for protected routes
export interface WithAuthProps {
  user: User;
  refreshUser: () => Promise<void>;
}

export function withAuth<P extends WithAuthProps>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: Omit<P, keyof WithAuthProps>) {
    const { user, isAuthenticated, isLoading, refreshUser } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated || !user) {
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }

    return <Component {...(props as P)} user={user} refreshUser={refreshUser} />;
  };
}

// Hook for role-based access control
export const useRoleCheck = (allowedRoles: User['role'][]) => {
  const { user, isAuthenticated } = useAuth();
  
  const hasAccess = isAuthenticated && user && allowedRoles.includes(user.role);
  
  return {
    hasAccess,
    userRole: user?.role,
    isAuthenticated,
  };
};

// Component for role-based rendering
interface RoleGuardProps {
  allowedRoles: User['role'][];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  children, 
  fallback = null 
}) => {
  const { hasAccess } = useRoleCheck(allowedRoles);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};