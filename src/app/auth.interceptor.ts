import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isLoggedIn } from './auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('accessToken');

  // Skip adding auth header for specific public auth endpoints (login/register/refresh/etc.)
  const publicAuthPattern = /\/auth\/(login|register|refresh|verify-email|resend-otp|forgot-password|reset-password)(?:$|\?|\/)/i;
  if (!token || publicAuthPattern.test(req.url)) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.status === 401) {
        // Clear stored tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Update auth state signal
        isLoggedIn.set(false);
        
        // Redirect to login page
        router.navigate(['/login'], { 
          queryParams: { expired: 'true' }
        });
      }
      
      return throwError(() => error);
    })
  );
};
