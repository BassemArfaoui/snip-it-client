import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
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
  return next(authReq);
};
