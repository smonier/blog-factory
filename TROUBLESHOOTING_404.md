# Troubleshooting 404 Errors

## Problem

Getting 404 errors when calling blog-service endpoints:

```
POST /modules/api/blog/ratings → 404
GET /modules/api/blog/comments/{id} → 404
```

## Solutions

### 1. Verify blog-service is Deployed

Check in Jahia Administration:

1. Go to `http://localhost:8080/cms/adminframe/default/en/settings.manageBundleMenus.html`
2. Look for **blog-service** module in the list
3. Status should be **Active** or **Started**

If not deployed:

```bash
cd /Users/stephane/Runtimes/0.Modules/blog-service
yarn build
yarn deploy
```

### 2. Check blog-service Endpoint Configuration

The blog-service module may use different endpoint paths. Common patterns:

**Option A: Standard (Current)**

```typescript
const BLOG_SERVICE_BASE_URL = "/modules/api/blog";
```

**Option B: Module-scoped**

```typescript
const BLOG_SERVICE_BASE_URL = "/modules/blog-service/api";
```

**Option C: CMS-scoped**

```typescript
const BLOG_SERVICE_BASE_URL = "/cms/blog/api";
```

**Option D: Custom path**
Check the blog-service JAX-RS `@Path` annotation for the actual path.

### 3. Verify JAX-RS Configuration

In blog-service, check the REST endpoint class:

```java
@Path("/api/blog")  // ← This defines the base path
public class BlogServiceEndpoint {

    @POST
    @Path("/ratings")  // ← Combined: /modules/api/blog/ratings
    public Response ratePost(...) { }
}
```

The full path is: `/modules` + `@Path` from class + `@Path` from method

### 4. Update blogService.ts Base URL

Edit `src/services/blogService.ts`:

```typescript
// Change this line to match blog-service actual path:
const BLOG_SERVICE_BASE_URL = "/modules/api/blog"; // ← Adjust here
```

Common blog-service configurations:

| JAX-RS @Path        | Full URL                    |
| ------------------- | --------------------------- |
| `/api/blog`         | `/modules/api/blog`         |
| `/blog-service/api` | `/modules/blog-service/api` |
| `/blog`             | `/modules/blog`             |

### 5. Test Endpoints Manually

Use curl or browser DevTools:

```bash
# Test ratings endpoint
curl -X GET http://localhost:8080/modules/api/blog/ratings/test-uuid

# Test comments endpoint
curl -X GET http://localhost:8080/modules/api/blog/comments/test-uuid

# If 404, try alternative paths:
curl -X GET http://localhost:8080/modules/blog-service/api/ratings/test-uuid
curl -X GET http://localhost:8080/cms/blog/api/ratings/test-uuid
```

### 6. Check Jahia Logs

Look for JAX-RS registration messages:

```bash
# In Jahia logs, look for:
grep -i "blog.*service" logs/jahia.log
grep -i "JAX-RS" logs/jahia.log
grep -i "@Path" logs/jahia.log
```

Should see something like:

```
Registered JAX-RS resource: BlogServiceEndpoint at /modules/api/blog
```

### 7. Rebuild and Deploy

After updating the base URL:

```bash
cd /Users/stephane/Runtimes/0.Modules/blog-factory
yarn build
yarn deploy
```

### 8. Clear Browser Cache

Sometimes old JavaScript is cached:

1. Open DevTools (F12)
2. Right-click reload button
3. Select "Empty Cache and Hard Reload"

## Quick Checklist

- [ ] blog-service module is deployed and active
- [ ] Verified JAX-RS @Path configuration in blog-service
- [ ] Updated BLOG_SERVICE_BASE_URL to match
- [ ] Rebuilt blog-factory: `yarn build`
- [ ] Deployed: `yarn deploy`
- [ ] Cleared browser cache
- [ ] Tested in browser DevTools Network tab

## Still Having Issues?

Check the blog-service source code:

```bash
cd /Users/stephane/Runtimes/0.Modules/blog-service
grep -r "@Path" src/
```

This will show you the actual endpoint paths configured.
