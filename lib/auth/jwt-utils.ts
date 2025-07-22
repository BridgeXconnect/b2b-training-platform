/**
 * JWT Utilities for Authentication
 * Simple JWT validation for BMAD system integration
 */

import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify a JWT token
 * @param token - JWT token to verify
 * @returns boolean indicating if token is valid
 */
export function verifyJwtToken(token: string): boolean {
  try {
    if (!token) {
      return false;
    }

    // In development, we might bypass verification
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      return true;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn('JWT_SECRET not configured, authentication will fail');
      return false;
    }

    const decoded = jwt.verify(token, secret);
    return !!decoded;
    
  } catch (error) {
    console.error('JWT verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Decode a JWT token without verification (for development/testing)
 * @param token - JWT token to decode
 * @returns decoded payload or null
 */
export function decodeJwtToken(token: string): JWTPayload | null {
  try {
    if (!token) {
      return null;
    }

    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
    
  } catch (error) {
    console.error('JWT decode failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Create a JWT token (for testing purposes)
 * @param payload - Payload to encode
 * @param expiresIn - Token expiration time
 * @returns JWT token string
 */
export function createJwtToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: string = '24h'): string | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn('JWT_SECRET not configured');
      return null;
    }

    const token = jwt.sign(payload, secret, { expiresIn });
    return token;
    
  } catch (error) {
    console.error('JWT creation failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns token string or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
}