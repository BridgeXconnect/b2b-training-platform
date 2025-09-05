/**
 * Session-based authentication utilities
 * Handles user identification and session management
 */

export interface SessionUser {
  id: string;
  sessionId: string;
  isAuthenticated: boolean;
  metadata?: {
    cefrLevel?: string;
    businessContext?: string;
    learningGoals?: string[];
    joinedAt: string;
  };
}

export class SessionManager {
  private static readonly SESSION_KEY = 'learningSessionId';
  private static readonly USER_KEY = 'sessionUser';

  /**
   * Get or create a session-based user
   */
  static getSessionUser(): SessionUser {
    if (typeof window === 'undefined') {
      // Server-side: generate temporary user
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: tempId,
        sessionId: tempId,
        isAuthenticated: false,
        metadata: {
          joinedAt: new Date().toISOString()
        }
      };
    }

    // Client-side: check for existing session
    let sessionUser = this.getStoredUser();
    
    if (!sessionUser) {
      sessionUser = this.createNewSessionUser();
      this.storeUser(sessionUser);
    }

    return sessionUser;
  }

  /**
   * Create a new session user
   */
  private static createNewSessionUser(): SessionUser {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = `user_${sessionId}`;
    
    return {
      id: userId,
      sessionId,
      isAuthenticated: false,
      metadata: {
        cefrLevel: 'B1', // Default CEFR level
        businessContext: 'Corporate Training',
        learningGoals: ['Professional Communication'],
        joinedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Get stored user from localStorage
   */
  private static getStoredUser(): SessionUser | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        // Validate stored user structure
        if (user.id && user.sessionId) {
          return user;
        }
      }
    } catch (error) {
      console.warn('Failed to parse stored user session:', error);
    }
    return null;
  }

  /**
   * Store user in localStorage
   */
  private static storeUser(user: SessionUser): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.SESSION_KEY, user.sessionId);
    } catch (error) {
      console.warn('Failed to store user session:', error);
    }
  }

  /**
   * Update user metadata
   */
  static updateUserMetadata(updates: Partial<SessionUser['metadata']>): void {
    const user = this.getSessionUser();
    user.metadata = { 
      ...user.metadata, 
      ...updates,
      // Ensure joinedAt is always defined
      joinedAt: user.metadata?.joinedAt || new Date().toISOString()
    };
    this.storeUser(user);
  }

  /**
   * Clear session (logout)
   */
  static clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.SESSION_KEY);
    }
  }

  /**
   * Extract user ID from request headers (server-side)
   */
  static extractUserFromRequest(request: Request): { userId: string; sessionId: string } {
    const sessionHeader = request.headers.get('x-session-id');
    const userHeader = request.headers.get('x-user-id');
    
    if (sessionHeader && userHeader) {
      return {
        userId: userHeader,
        sessionId: sessionHeader
      };
    }
    
    // Fallback to anonymous user
    const fallbackId = `anonymous_${Date.now()}`;
    return {
      userId: fallbackId,
      sessionId: fallbackId
    };
  }

  /**
   * Validate session user structure
   */
  static isValidSessionUser(user: any): user is SessionUser {
    return (
      user &&
      typeof user.id === 'string' &&
      typeof user.sessionId === 'string' &&
      typeof user.isAuthenticated === 'boolean'
    );
  }
}

/**
 * Hook for React components to use session-based authentication
 */
export function useSessionAuth() {
  const user = SessionManager.getSessionUser();
  
  const updateProfile = (updates: Partial<SessionUser['metadata']>) => {
    SessionManager.updateUserMetadata(updates);
  };
  
  const logout = () => {
    SessionManager.clearSession();
    // Trigger page reload or redirect as needed
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };
  
  return {
    user,
    updateProfile,
    logout,
    isAuthenticated: user.isAuthenticated
  };
}