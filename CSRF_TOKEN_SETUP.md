# CSRF Token Setup for Blog Factory

## Problem

The blog-factory needs a CSRF token to submit ratings and comments, but the token is coming back as `null`.

## Solution

You need to add a CSRF token meta tag to your Jahia page template. The token is required by the blog-service GraphQL mutations.

### For JSP Templates

Add this to the `<head>` section of your page template:

```jsp
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<meta name="csrf-token" content="${pageContext.request.session.getAttribute('X-CSRF-TOKEN')}" />
```

Or if using renderContext:

```jsp
<meta name="csrf-token" content="${renderContext.request.session.getAttribute('X-CSRF-TOKEN')}" />
```

### For JavaScript Module Templates

If you're using a JavaScript module template (server.tsx), you need to output the token from the server-side context:

```tsx
export default function PageTemplate(props, context) {
  const csrfToken = context?.currentResource?.getNode()?.getSession()?.getAttribute("X-CSRF-TOKEN");

  return (
    <html>
      <head>
        <meta name="csrf-token" content={csrfToken || ""} />
        {/* other head content */}
      </head>
      <body>{/* page content */}</body>
    </html>
  );
}
```

### Alternative: Use Cookie

If you can't modify the template, configure Jahia to set a CSRF token cookie:

1. In Jahia configuration, enable CSRF cookie
2. Cookie name should be: `CSRF-TOKEN` or `X-CSRF-TOKEN`
3. The blog-factory will automatically read it

### Testing

After adding the meta tag, open browser DevTools Console and run:

```javascript
document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
```

You should see the token value (not null).

### Verify in Network Tab

When you submit a rating or comment:

1. Open DevTools → Network tab
2. Filter by "graphql"
3. Click on the request
4. Check "Payload" → "variables"
5. You should see: `"token": "actual-token-value-here"`

## Current Token Detection

The blog-factory tries to find the CSRF token in this order:

1. **Meta tag**: `<meta name="csrf-token" content="...">`
2. **Cookie**: `CSRF-TOKEN` or `X-CSRF-TOKEN`
3. **Window context**: `window.contextJsf.csrfToken` (if exposed by Jahia)

Check browser console for messages like:

- ✅ "CSRF token found in meta tag"
- ⚠️ "CSRF token not found! Check page template"

## Quick Test Page

Create a simple test page with this content:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta name="csrf-token" content="test-token-123" />
  </head>
  <body>
    <h1>CSRF Token Test</h1>
    <script>
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
      console.log("CSRF Token:", token);
      if (token) {
        alert("Token found: " + token);
      } else {
        alert("Token NOT found!");
      }
    </script>
  </body>
</html>
```

## For Development/Testing

If you just need to test locally and can't modify templates yet, you can manually add the meta tag via browser console:

```javascript
// Run this in browser console
const meta = document.createElement("meta");
meta.name = "csrf-token";
meta.content = "your-actual-csrf-token-here";
document.head.appendChild(meta);
```

Then try submitting a comment/rating again.
