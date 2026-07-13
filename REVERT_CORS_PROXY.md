# How to Revert Vercel CORS Proxy (Option B) to Direct Backend CORS (Option A)

This document describes the changes implemented for **Option B** (Vercel Proxy rewrite) and explains how to revert them if you configure CORS directly on your backend API server (`https://tenancyapi.siddev.online`) in the future.

---

## What was Implemented (Option B)

To bypass browser CORS restrictions without changing the backend API configuration, we routed all API calls through a Vercel-configured proxy:

1. **`vercel.json` (Created)**:
   Instructs Vercel to route all frontend requests starting with `/api` to the actual backend API host (`https://tenancyapi.siddev.online/api`) behind the scenes.

2. **`src/app/interceptors/auth.interceptor.ts` (Modified)**:
   Added a URL rewriter that intercepts all outgoing HTTP requests targeting `https://tenancyapi.siddev.online` and redirects them to the local `/api` path.

---

## How to Revert to Option A (Direct Backend CORS)

If you enable CORS headers on your backend server in the future and want the frontend to make requests directly to the backend API without Vercel's proxy rewrite, follow these three steps:

### Step 1: Revert `auth.interceptor.ts`
Open `src/app/interceptors/auth.interceptor.ts` and revert lines **11 to 24** back to their original state:

#### Revert This:
```typescript
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
```

#### Back to Original:
```typescript
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
```

---

### Step 2: Remove the Proxy Rewrite from `vercel.json`
Open `vercel.json` in the root of your project and remove the `/api/:path*` rewrite block. 

Your `vercel.json` should look like this:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "outputDirectory": "dist/browser",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### Step 3: Configure CORS on your Backend API
Configure your API server to accept cross-origin requests from your Vercel domains (e.g. `https://tenancy-orpin.vercel.app` and any other custom domains).
