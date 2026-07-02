import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  console.log('authInterceptor - Intercepting request:', req.url);
  console.log('authInterceptor - Token found in localStorage:', token ? 'YES' : 'NO');
  
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('authInterceptor - Attached Bearer Authorization header.');
    return next(clonedRequest);
  }
  
  return next(req);
};
