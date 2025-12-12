import { signal } from '@angular/core';

// Very small auth store using Angular signals. Start false (not logged in).
export const isLoggedIn = signal<boolean>(false);

export const login = () => isLoggedIn.set(true);
export const logout = () => isLoggedIn.set(false);
