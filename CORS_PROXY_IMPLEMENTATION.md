# CORS Proxy Implementation (Option B / Option 2)

This document provides a detailed overview of the CORS bypass solution implemented for the **TENANCY** frontend application deployed on Vercel.

---

## The Problem
When the frontend application is hosted on Vercel (e.g., `tenancy-orpin.vercel.app`), browser security prevents it from directly calling the backend API server (`tenancyapi.siddev.online`) because:
1. They are on different domains.
2. The backend server does not return the proper `Access-Control-Allow-Origin` CORS headers.
3. This blocks the browser from completing the preflight OPTIONS request, leaving the application stuck at the login screen.

---

## The Solution (Option B)
Instead of forcing direct browser-to-backend communication, all API calls are routed through a Vercel-configured server-side rewrite proxy. Since Vercel executes the API calls from its own servers, it bypasses CORS restrictions entirely before serving the response back to your client.

This was achieved in two steps:

### 1. Vercel Proxy Rules Configuration
We created the Vercel project configuration file at the root:
* **[vercel.json](vercel.json)**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "outputDirectory": "dist/browser",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://tenancyapi.siddev.online/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
* **`outputDirectory`**: Points to `dist/browser` where the new Angular build system compiles the client-side bundles.
* **`rewrites (CORS Proxy)`**: Any request targeting `/api/...` on the frontend is proxy-forwarded to `https://tenancyapi.siddev.online/api/...` behind the scenes by Vercel.
* **`rewrites (SPA Routing)`**: Directs all other requests to `/index.html` to allow Angular's router to handle deep links and avoid 404 page refreshes.

### 2. Angular HTTP Request Interceptor Rewrite
To avoid manually changing hardcoded API domains across all Angular service files, we modified the central interceptor:
* **[src/app/interceptors/auth.interceptor.ts](src/app/interceptors/auth.interceptor.ts)**

We added code to catch any outgoing HTTP requests targeting the external domain and direct them to the local proxy route `/api`:

```typescript
  let targetUrl = req.url;
  
  // Rewrite backend domain to Vercel's relative proxy route (/api)
  if (targetUrl.startsWith('https://tenancyapi.siddev.online/api')) {
    targetUrl = targetUrl.replace('https://tenancyapi.siddev.online/api', '/api');
  } else if (targetUrl.startsWith('https://tenancyapi.siddev.online')) {
    targetUrl = targetUrl.replace('https://tenancyapi.siddev.online', '/api');
  }
```

---

## How to Revert to Option A (Direct Backend CORS)
If you configure CORS headers on the backend API server (`tenancyapi.siddev.online`) in the future and want to bypass Vercel's proxy:

1. **Revert the interceptor**: In `auth.interceptor.ts`, remove the URL rewrite conditions and clone the request normally.
2. **Clean up `vercel.json`**: Remove the `/api/:path*` block from the rewrites array.
3. Refer to [REVERT_CORS_PROXY.md](REVERT_CORS_PROXY.md) for step-by-step code comparison instructions.
