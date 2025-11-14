# Blog Service Integration

This blog-factory module is designed to work with the **blog-service** module, which provides REST API endpoints for ratings and comments.

## Architecture

- **blog-factory**: Frontend module with React components (SSR + Islands)
- **blog-service**: Backend module with JAX-RS REST API endpoints

## Setup

### 1. Deploy blog-service Module

Make sure the `blog-service` module is deployed to your Jahia instance first. This module provides:

- **POST** `/modules/graphql/ratings` - Submit a rating
- **GET** `/modules/graphql/ratings/{postId}` - Get rating statistics
- **POST** `/modules/graphql/comments` - Create a comment
- **GET** `/modules/graphql/comments/{postId}` - Get approved comments
- **PUT** `/modules/graphql/comments/{commentId}/moderate` - Moderate comment (admin only)

### 2. Configure CSRF Token

For security, blog-service requires a CSRF token for POST/PUT requests.

#### Option 1: Add CSRF token to your page template

In your page template or site settings, add a meta tag with the CSRF token:

```html
<meta
  name="csrf-token"
  content="${renderContext.request.getSession(false)?.getAttribute('csrf-token')}"
/>
```

#### Option 2: Set CSRF token as cookie

The blog-service can read the CSRF token from cookies named `CSRF-TOKEN` or `X-CSRF-TOKEN`.

#### Option 3: Use .env for development

During development, you can add the CSRF token to `.env`:

```bash
BLOG_SERVICE_CSRF_TOKEN=your-token-here
```

**Note**: The `.env` file is for deployment configuration only and won't inject the token into client-side code. You still need option 1 or 2 for runtime.

### 3. Build and Deploy

```bash
yarn build
yarn deploy
```

## API Client

The `src/services/blogService.ts` file provides a typed API client for blog-service:

```typescript
import { ratePost, createComment, getComments } from "../services/blogService";

// Rate a post (1-5 stars)
const result = await ratePost(postId, 5);

// Create a comment
const result = await createComment(postId, {
  authorName: "John Doe",
  authorEmail: "john@example.com",
  body: "Great article!",
});

// Get comments
const result = await getComments(postId);
```

## Client Components

### Rating.client.tsx

Interactive 5-star rating widget that:

- Displays average rating and count
- Allows users to submit ratings
- Prevents duplicate ratings
- Updates UI optimistically

### Comments.client.tsx

Comment form and list that:

- Loads approved comments via API
- Allows users to submit comments
- Shows pending moderation message
- Handles form validation

## Security

- All POST/PUT requests require CSRF token
- Comments go through moderation (pending → approved/rejected)
- Email addresses are never displayed publicly
- HTML in comments is sanitized by blog-service

## Development

To test the integration locally:

1. Start Jahia with Docker:

   ```bash
   docker compose up --wait
   ```

2. Deploy blog-service module

3. Start dev mode:

   ```bash
   yarn dev
   ```

4. Create blog content in Jahia Content Editor

5. View in Pages mode to test interactive features

## Troubleshooting

### "Failed to submit rating/comment"

- Check browser console for API errors
- Verify blog-service is deployed and running
- Ensure CSRF token is properly configured
- Check Jahia logs for backend errors

### CSRF token not found

- Add `<meta name="csrf-token">` to your page template
- Or configure CSRF token cookie in Jahia

### Comments not appearing

- Check comment status (pending/approved/rejected)
- Verify blog-service API returns comments
- Check browser console for loading errors
