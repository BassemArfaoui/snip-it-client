import { signal } from '@angular/core';
import { AuthService } from './auth.service';

// Auth state signal: reflects whether user has a valid access token
export const isLoggedIn = signal<boolean>(
  !!localStorage.getItem('accessToken')
);

// Username signal - will be initialized from token on first access
export const username = signal<string | null>(null);

// User id signal - used for profile routing
export const userId = signal<number | null>(null);

// Reference to AuthService (initialized lazily)
let authService: AuthService | null = null;

export const setAuthService = (service: AuthService) => {
  authService = service;
};

/**
 * Get current username from the access token
 */
export const getUsername = (): string | null => {
  if (!authService) return null;
  return authService.getUsername();
};

/**
 * Get current user id from the access token
 */
export const getUserId = (): number | null => {
  if (!authService) return null;
  return authService.getUserId();
};

export const login = () => {
  isLoggedIn.set(true);
  // Update username from token
  if (authService) {
    const user = authService.getUsername();
    username.set(user);
    const id = authService.getUserId();
    userId.set(id);
  }
};

export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  isLoggedIn.set(false);
  username.set(null);
  userId.set(null);
};

/**
 * Initialize auth state from localStorage on app startup
 */
export const initializeAuthState = () => {
  const hasToken = !!localStorage.getItem('accessToken');
  isLoggedIn.set(hasToken);
  // Username will be extracted from token when needed
  if (hasToken && authService) {
    const user = authService.getUsername();
    username.set(user);
    const id = authService.getUserId();
    userId.set(id);
  }
};

