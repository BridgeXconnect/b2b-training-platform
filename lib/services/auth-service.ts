/**
 * Authentication Service
 * Handles frontend-backend authentication integration
 * Manages JWT tokens, user sessions, and authentication state
 */

import React from 'react';
import { apiClient, type LoginCredentials, type AuthResponse, type User } from '../api-client';
import { backendIntegration } from './backend-integration';
import { logger } from '../logger';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  sessionId: string | null;
  backendConnected: boolean;
}

export interface AuthEventListeners {
  onAuthStateChanged?: (state: AuthState) => void;
  onLoginSuccess?: (user: User) => void;
  onLoginError?: (error: string) => void;
  onLogout?: () => void;
  onTokenRefreshed?: (tokens: { accessToken: string; refreshToken: string }) => void;
}

export class AuthService {
  private static instance: AuthService | null = null;
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
    sessionId: null,
    backendConnected: false
  };
  
  private listeners: AuthEventListeners = {};
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initialize(): Promise<void> {
    // Check if we have stored tokens
    const accessToken = this.getStoredAccessToken();
    const refreshToken = this.getStoredRefreshToken();

    if (accessToken && refreshToken) {
      try {
        // Verify token with backend
        const user = await apiClient.getCurrentUser();
        await this.setAuthenticatedState(user, accessToken, refreshToken);
        logger.info('[AuthService] Restored authentication from stored tokens');
      } catch (error) {
        // Tokens might be expired, try to refresh
        try {
          const authResponse = await apiClient.refreshAccessToken(refreshToken);
          await this.setAuthenticatedState(authResponse.user, authResponse.access_token, authResponse.refresh_token);
          logger.info('[AuthService] Refreshed expired tokens on initialization');
        } catch (refreshError) {
          // Both tokens invalid, clear storage
          this.clearAuthenticationState();
          logger.warn('[AuthService] Failed to restore authentication, cleared tokens');
        }
      }
    }

    // Start periodic health check
    this.startHealthCheck();
    
    // Test backend connectivity
    await this.checkBackendConnectivity();
  }

  // Authentication Methods
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    this.updateState({ loading: true, error: null });

    try {
      const authResponse = await apiClient.login(credentials);
      await this.setAuthenticatedState(authResponse.user, authResponse.access_token, authResponse.refresh_token);
      
      this.listeners.onLoginSuccess?.(authResponse.user);
      logger.info(`[AuthService] User logged in successfully: ${authResponse.user.email}`);
      
      return authResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.updateState({ loading: false, error: errorMessage });
      this.listeners.onLoginError?.(errorMessage);
      logger.error('[AuthService] Login failed:', error);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      // Call backend logout if connected
      if (this.state.backendConnected) {
        await apiClient.logout();
      }
    } catch (error) {
      logger.warn('[AuthService] Backend logout failed:', error);
    } finally {
      // Always clear local state
      this.clearAuthenticationState();
      this.listeners.onLogout?.();
      logger.info('[AuthService] User logged out');
    }
  }

  public async refreshTokens(): Promise<void> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const authResponse = await apiClient.refreshAccessToken(refreshToken);
      
      // Update stored tokens
      apiClient.setAuthTokens(authResponse.access_token, authResponse.refresh_token);
      
      this.listeners.onTokenRefreshed?.({
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token
      });

      logger.info('[AuthService] Tokens refreshed successfully');
    } catch (error) {
      logger.error('[AuthService] Token refresh failed:', error);
      this.clearAuthenticationState();
      throw error;
    }
  }

  // State Management
  private async setAuthenticatedState(user: User, accessToken: string, refreshToken: string): Promise<void> {
    // Store tokens
    apiClient.setAuthTokens(accessToken, refreshToken);
    
    // Create backend integration session
    let sessionId: string | null = null;
    try {
      const backendSession = await backendIntegration.createUserSession(
        user.id,
        user.role,
        {
          email: user.email,
          name: user.name,
          authenticatedAt: new Date().toISOString()
        }
      );
      sessionId = backendSession.id;
    } catch (error) {
      logger.warn('[AuthService] Failed to create backend session:', error);
    }

    // Update state
    this.updateState({
      isAuthenticated: true,
      user,
      loading: false,
      error: null,
      sessionId
    });

    // Start token refresh timer
    this.startTokenRefreshTimer();
  }

  private clearAuthenticationState(): void {
    // Clear tokens
    apiClient.clearAuthTokens();
    
    // Stop timers
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    // Update state
    this.updateState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      sessionId: null
    });
  }

  private updateState(updates: Partial<AuthState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.onAuthStateChanged?.(this.state);
  }

  // Token Management
  private getStoredAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private getStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  private startTokenRefreshTimer(): void {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
    }

    // Refresh token every 25 minutes (5 minutes before expiry)
    this.tokenRefreshTimer = setInterval(async () => {
      try {
        await this.refreshTokens();
      } catch (error) {
        logger.error('[AuthService] Automatic token refresh failed:', error);
        this.clearAuthenticationState();
      }
    }, 25 * 60 * 1000);
  }

  // Backend Connectivity
  private async checkBackendConnectivity(): Promise<void> {
    try {
      await apiClient.healthCheck();
      this.updateState({ backendConnected: true });
      logger.info('[AuthService] Backend connectivity: ONLINE');
    } catch (error) {
      this.updateState({ backendConnected: false });
      logger.warn('[AuthService] Backend connectivity: OFFLINE');
    }
  }

  private startHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Check backend health every 30 seconds
    this.healthCheckTimer = setInterval(async () => {
      await this.checkBackendConnectivity();
    }, 30 * 1000);
  }

  // Event Listeners
  public setEventListeners(listeners: AuthEventListeners): void {
    this.listeners = { ...this.listeners, ...listeners };
  }

  public removeEventListeners(): void {
    this.listeners = {};
  }

  // Getters
  public getState(): AuthState {
    return { ...this.state };
  }

  public getUser(): User | null {
    return this.state.user;
  }

  public isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  public getSessionId(): string | null {
    return this.state.sessionId;
  }

  public isBackendConnected(): boolean {
    return this.state.backendConnected;
  }

  // Utility Methods
  public async ensureValidToken(): Promise<string> {
    const accessToken = this.getStoredAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    // Check if token needs refresh (simple check)
    try {
      await apiClient.getCurrentUser();
      return accessToken;
    } catch (error) {
      // Token might be expired, try to refresh
      await this.refreshTokens();
      const newToken = this.getStoredAccessToken();
      if (!newToken) {
        throw new Error('Failed to refresh token');
      }
      return newToken;
    }
  }

  public async waitForAuthentication(timeout: number = 5000): Promise<boolean> {
    if (this.state.isAuthenticated) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(false);
      }, timeout);

      const checkAuth = () => {
        if (this.state.isAuthenticated) {
          clearTimeout(timeoutId);
          resolve(true);
        } else {
          setTimeout(checkAuth, 100);
        }
      };

      checkAuth();
    });
  }

  // Cleanup
  public shutdown(): void {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    this.removeEventListeners();
    logger.info('[AuthService] Service shut down');
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export hook for React components
export function useAuth(): AuthState & {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
} {
  const [state, setState] = React.useState<AuthState>(authService.getState());

  React.useEffect(() => {
    authService.setEventListeners({
      onAuthStateChanged: setState
    });

    return () => {
      authService.removeEventListeners();
    };
  }, []);

  return {
    ...state,
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService),
    refreshTokens: authService.refreshTokens.bind(authService)
  };
}

export default authService;