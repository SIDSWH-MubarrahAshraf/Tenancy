import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, filter, take, throwError, BehaviorSubject } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  let targetUrl = req.url;
  // Option B CORS bypass proxy rewrite:
  if (targetUrl.startsWith('https://tenancyapi.siddev.online/api')) {
    targetUrl = targetUrl.replace('https://tenancyapi.siddev.online/api', '/api');
  } else if (targetUrl.startsWith('https://tenancyapi.siddev.online')) {
    targetUrl = targetUrl.replace('https://tenancyapi.siddev.online', '/api');
  }

  const update: any = { url: targetUrl };
  if (token) {
    update.setHeaders = {
      Authorization: `Bearer ${token}`
    };
  }

  const authReq = req.clone(update);

  return next(authReq).pipe(
    catchError((error) => {
      // If unauthorized, attempt to perform a silent refresh
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        const newToken = response?.data?.accessToken || response?.accessToken;
        if (newToken) {
          refreshTokenSubject.next(newToken);
          return next(req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`
            }
          }));
        }
        
        authService.logout();
        return throwError(() => new Error('Refresh token did not return an access token'));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      })
    );
  } else {
    // If a refresh is already in progress, wait for the new token in the subject queue
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => {
        return next(req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        }));
      })
    );
  }
}
