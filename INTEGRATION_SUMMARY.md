# Blog-Factory Integration Summary

## What Was Done

Successfully wired `blog-factory` module to use the `blog-service` REST API for ratings and comments functionality.

### Files Created/Modified

1. **`.env`** - Added CSRF token configuration placeholder
2. **`.env.example`** - Template for environment configuration
3. **`src/services/blogService.ts`** - NEW: REST API client for blog-service
   - `ratePost()` - Submit ratings
   - `getRating()` - Get rating statistics
   - `getComments()` - Fetch approved comments
   - `createComment()` - Submit new comments
   - `moderateComment()` - Admin moderation (approve/reject)
   - CSRF token handling from meta tags or cookies

4. **`src/components/Rating/Rating.client.tsx`** - UPDATED
   - Changed from GraphQL to REST API
   - Now calls `ratePost()` from blogService
   - Receives and displays server response with updated stats
   - Better error handling with user alerts

5. **`src/components/Comments/Comments.client.tsx`** - UPDATED
   - Changed from GraphQL to REST API
   - Now calls `createComment()` and `getComments()` from blogService
   - Loads comments on mount if not provided
   - Better error handling with user-friendly messages

6. **`BLOG_SERVICE.md`** - NEW: Complete integration documentation
7. **`README.md`** - UPDATED: Added prerequisites and configuration section

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│                                                              │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │  Rating.client.tsx   │      │ Comments.client.tsx  │    │
│  │  (Island Component)  │      │  (Island Component)  │    │
│  └──────────┬───────────┘      └──────────┬──────────┘    │
│             │                              │                │
│             └──────────────┬───────────────┘                │
│                            │                                │
│                  ┌─────────▼────────────┐                   │
│                  │  blogService.ts      │                   │
│                  │  (API Client)        │                   │
│                  └─────────┬────────────┘                   │
└────────────────────────────┼──────────────────────────────┘
                             │ HTTP Requests
                             │ + CSRF Token
                             │
                   ┌─────────▼──────────┐
                   │  Jahia Server      │
                   │                    │
                   │  ┌──────────────┐  │
                   │  │ blog-service │  │
                   │  │ REST API     │  │
                   │  │              │  │
                   │  │ - /ratings   │  │
                   │  │ - /comments  │  │
                   │  └──────┬───────┘  │
                   │         │          │
                   │  ┌──────▼───────┐  │
                   │  │  JCR Store   │  │
                   │  │  (blognt:*)  │  │
                   │  └──────────────┘  │
                   └────────────────────┘
```

### API Endpoints Used

The blog-service module must provide these endpoints:

- **POST** `/modules/graphql/ratings` - Submit rating

  ```json
  { "postId": "uuid", "rating": 5 }
  ```

- **GET** `/modules/graphql/ratings/{postId}` - Get rating stats

  ```json
  { "postId": "uuid", "averageRating": 4.5, "ratingCount": 10 }
  ```

- **POST** `/modules/graphql/comments` - Create comment

  ```json
  {
    "postId": "uuid",
    "authorName": "John",
    "authorEmail": "john@example.com",
    "body": "Great post!"
  }
  ```

- **GET** `/modules/graphql/comments/{postId}` - Get comments
  ```json
  {
    "postId": "uuid",
    "comments": [...],
    "total": 5
  }
  ```

### CSRF Token Flow

1. **Server-side**: Jahia generates CSRF token in session
2. **Page Template**: Adds token to meta tag
   ```html
   <meta name="csrf-token" content="${csrf-token}" />
   ```
3. **Client-side**: blogService reads token from meta tag
4. **API Requests**: Token sent in `X-CSRF-TOKEN` header
5. **blog-service**: Validates token before processing

## Setup Instructions

### 1. Deploy blog-service Module

Ensure the `blog-service` module is deployed to Jahia before using blog-factory.

### 2. Configure CSRF Token

**Option A: Meta Tag (Recommended)**

Add to your page template:

```html
<meta
  name="csrf-token"
  content="${renderContext.request.getSession(false)?.getAttribute('csrf-token')}"
/>
```

**Option B: Cookie**

Configure Jahia to set `CSRF-TOKEN` or `X-CSRF-TOKEN` cookie.

### 3. Update .env (Optional for Development)

Add to `.env` for deployment configuration:

```bash
BLOG_SERVICE_CSRF_TOKEN=your-token-here
```

**Note**: This only affects `yarn deploy`, not runtime behavior.

### 4. Build and Deploy

```bash
yarn build
yarn deploy
```

## Testing

1. Create a blog post in Jahia Content Editor
2. View the post in Pages mode
3. Try the rating widget (click stars 1-5)
4. Try submitting a comment
5. Check browser console for API calls
6. Check Jahia logs for blog-service activity

## Benefits of REST API Integration

✅ **Separation of Concerns**: Frontend (blog-factory) separate from backend (blog-service)
✅ **Type Safety**: TypeScript types for all API responses
✅ **Better Error Handling**: Clear error messages for users
✅ **Scalability**: blog-service can be deployed independently
✅ **Security**: CSRF protection on all mutations
✅ **Flexibility**: Easy to add new endpoints without changing CND
✅ **Performance**: Optimized data loading with selective queries

## Migration Notes

### Before (GraphQL)

- Direct JCR mutations via GraphQL
- Complex query construction
- Limited error handling
- No CSRF protection

### After (REST API)

- Clean REST endpoints
- Simple function calls
- Rich error responses
- CSRF token validation
- Server-side business logic in blog-service

## Build Output

```
✓ Client bundle: 6.5 KB (Rating + Comments + blogService)
✓ Server bundle: 36.7 KB (SSR components)
✓ Build time: ~160ms
```

The blogService module is now shared between Rating and Comments, reducing duplication.

## Next Steps

1. ✅ Add CSRF token meta tag to your page template
2. ✅ Deploy blog-service module to Jahia
3. ✅ Test rating functionality
4. ✅ Test comment submission
5. ⏳ Implement comment moderation UI (optional)
6. ⏳ Add real-time updates with WebSockets (optional enhancement)
