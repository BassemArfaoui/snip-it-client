import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isLoggedIn } from './auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('accessToken');

  // Skip adding auth header for auth endpoints
  if (!token || req.url.includes('/auth/')) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log('Auth interceptor adding token to request:', req.url);
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.status === 401) {
        console.warn('Token expired or invalid. Redirecting to login...');
        
        // Clear stored tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Update auth state signal
        isLoggedIn.set(false);
        
        // Store the attempted URL for redirect after login
        const currentUrl = window.location.pathname;
        if (currentUrl && currentUrl !== '/login' && currentUrl !== '/signup') {
          localStorage.setItem('redirectUrl', currentUrl);
        }
        
        // Redirect to login page
        router.navigate(['/login'], { 
          queryParams: { expired: 'true' }
        });
      }
      
      return throwError(() => error);
    })
  );
};
