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
  console.log('login() called');
  isLoggedIn.set(true);
  // Update username from token
  if (authService) {
    const user = authService.getUsername();
    console.log('Username from token:', user);
    username.set(user);
    const id = authService.getUserId();
    console.log('UserID from token:', id);
    userId.set(id);
    console.log('userId signal set to:', id);
  } else {
    console.warn('authService is null in login()');
  }
};

export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  isLoggedIn.set(false);
  username.set(null);
  userId.set(null);
};

export const updateUsername = (newUsername: string) => {
  username.set(newUsername);
};

/**
 * Initialize auth state from localStorage on app startup
 */
export const initializeAuthState = () => {
  const hasToken = !!localStorage.getItem('accessToken');
  console.log('initializeAuthState() called. hasToken:', hasToken, 'authService:', !!authService);
  isLoggedIn.set(hasToken);
  // Username will be extracted from token when needed
  if (hasToken && authService) {
    const user = authService.getUsername();
    const id = authService.getUserId();
    console.log('On app startup - username:', user, 'userId:', id);
    username.set(user);
    userId.set(id);
  }
};

