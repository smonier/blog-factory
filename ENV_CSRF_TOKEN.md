# Using CSRF Token from .env

Since the CSRF token is stored in `.env` for security, you need to inject it from the server-side into the client-side JavaScript.

## Step 1: Add Token to .env

```bash
# .env
BLOG_SERVICE_CSRF_TOKEN=your-actual-csrf-token-here
```

## Step 2: Use in Your Page Template

In your page template server component, use the `getServerCsrfToken` utility and inject it:

### Example: Page Template with CSRF Token

```tsx
import { getServerCsrfToken, injectCsrfTokenScript } from "./lib/csrf";

export default function PageTemplate(props, context) {
  const csrfToken = getServerCsrfToken(context);

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>My Blog</title>
        {/* Inject CSRF token into page */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          window.__CSRF_TOKEN__ = ${JSON.stringify(csrfToken)};
        `,
          }}
        />
      </head>
      <body>{/* Your page content with BlogPost, Comments, Rating components */}</body>
    </html>
  );
}
```

### Alternative: Using the Helper Function

```tsx
import { getServerCsrfToken, injectCsrfTokenScript } from "./lib/csrf";

export default function PageTemplate(props, context) {
  const csrfToken = getServerCsrfToken(context);

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>My Blog</title>
      </head>
      <body>
        {/* Your page content */}

        {/* Inject CSRF token at end of body */}
        <div
          dangerouslySetInnerHTML={{
            __html: injectCsrfTokenScript(csrfToken),
          }}
        />
      </body>
    </html>
  );
}
```

## Step 3: Verify Token is Available

After deploying, open browser console and check:

```javascript
window.__CSRF_TOKEN__;
```

You should see your token value, not `undefined`.

## How It Works

1. **Server-side** (build/deploy time):
   - `getServerCsrfToken()` reads token from `.env` via `process.env.BLOG_SERVICE_CSRF_TOKEN`
   - Token is injected into HTML as `window.__CSRF_TOKEN__`

2. **Client-side** (runtime):
   - `blogService.ts` checks `window.__CSRF_TOKEN__` first
   - Token is included in all GraphQL mutation requests
   - blog-service validates the token

## Token Detection Order

The client-side code checks for tokens in this order:

1. ✅ **window.**CSRF_TOKEN**** (injected from server/env)
2. Meta tag: `<meta name="csrf-token">`
3. Cookie: `CSRF-TOKEN` or `X-CSRF-TOKEN`
4. Window context: `window.contextJsf.csrfToken`

## Security Notes

- ✅ Token stays in `.env` and is never committed to git
- ✅ Token is injected server-side during page render
- ✅ Each environment (dev/staging/prod) can have different tokens
- ✅ Client-side code reads from `window.__CSRF_TOKEN__`

## Troubleshooting

### Token is undefined

Check:

1. Is token set in `.env`?
2. Did you restart the server after changing `.env`?
3. Is `getServerCsrfToken()` being called in your template?
4. Check browser console for: `[BlogService] CSRF token found in window.__CSRF_TOKEN__`

### Token not working

Check:

1. Is the token value correct?
2. Check browser DevTools → Network → graphql request → Payload → variables
3. Should see: `"token": "your-token-value"`

### Still getting "Missing CSRF token" error

The token may be invalid or expired. Generate a new token in your blog-service admin panel or configuration.
