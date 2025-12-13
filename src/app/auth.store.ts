import { signal } from '@angular/core';

// Auth state signal: reflects whether user has a valid access token
export const isLoggedIn = signal<boolean>(
  !!localStorage.getItem('accessToken')
);

export const login = () => isLoggedIn.set(true);

export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  isLoggedIn.set(false);
};

/**
 * Initialize auth state from localStorage on app startup
 */
export const initializeAuthState = () => {
  const hasToken = !!localStorage.getItem('accessToken');
  isLoggedIn.set(hasToken);
};

