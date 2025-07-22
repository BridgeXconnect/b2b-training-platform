/**
 * Token Utilities for User Management
 * Helper functions for extracting user information from tokens
 */

import { decodeJwtToken, JWTPayload } from './jwt-utils';

export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

/**
 * Extract user information from JWT token
 * @param token - JWT token string
 * @returns User object or null
 */
export function getUserFromToken(token: string): User | null {
  try {
    if (!token) {
      return null;
    }

    const payload = decodeJwtToken(token);
    if (!payload) {
      return null;
    }

    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    
  } catch (error) {
    console.error('Failed to extract user from token:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Create a development user for testing
 * @returns Development user object
 */
export function createDevUser(): User {
  return {
    id: 'dev-user-' + Date.now(),
    email: 'dev@example.com',
    role: 'student',
    name: 'Development User'
  };
}

/**
 * Validate user role
 * @param user - User object
 * @param requiredRole - Required role for access
 * @returns boolean indicating if user has required role
 */
export function hasRole(user: User, requiredRole: string): boolean {
  return user.role === requiredRole || user.role === 'admin';
}

/**
 * Check if user has any of the specified roles
 * @param user - User object
 * @param roles - Array of acceptable roles
 * @returns boolean indicating if user has any of the roles
 */
export function hasAnyRole(user: User, roles: string[]): boolean {
  return roles.includes(user.role) || user.role === 'admin';
}