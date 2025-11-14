# Quick Start: blog-service Integration

## Prerequisites

1. ✅ blog-service module deployed to Jahia
2. ✅ CSRF token configured (meta tag or cookie)

## Setup in 3 Steps

### 1. Add CSRF Token to Page Template

```html
<!-- Add this to your page template head section -->
<meta
  name="csrf-token"
  content="${renderContext.request.getSession(false)?.getAttribute('csrf-token')}"
/>
```

### 2. Configure .env (Optional)

```bash
# Only needed for deployment, not runtime
BLOG_SERVICE_CSRF_TOKEN=your-token-here
```

### 3. Deploy

```bash
yarn build
yarn deploy
```

## How to Test

1. Create blog content in Jahia:
   - Create a Blog (blognt:blog)
   - Add Blog Posts (blognt:post)
   - Add Authors (blognt:author)

2. View in Pages mode

3. Test Rating:
   - Click stars (1-5)
   - Should see updated average immediately
   - Check browser console for API success

4. Test Comments:
   - Fill out comment form
   - Submit
   - Should see "pending moderation" message

## API Endpoints

```
POST   /modules/graphql/ratings         - Submit rating
GET    /modules/graphql/ratings/{id}    - Get ratings
POST   /modules/graphql/comments        - Submit comment
GET    /modules/graphql/comments/{id}   - Get comments
PUT    /modules/graphql/comments/{id}/moderate - Moderate
```

## Troubleshooting

### Rating/Comment submission fails

**Check:**

- [ ] blog-service module is deployed
- [ ] CSRF token meta tag exists on page
- [ ] Browser console shows token in request headers
- [ ] Jahia logs show API requests

**Fix:**

```html
<!-- Add to template -->
<meta name="csrf-token" content="..." />
```

### "CSRF token not found"

**Cause:** Missing meta tag or cookie

**Fix:** Add meta tag to page template (see step 1 above)

### API returns 404

**Cause:** blog-service not deployed or wrong URL

**Fix:**

1. Deploy blog-service module
2. Verify endpoint: `http://localhost:8080/modules/graphql/ratings`

### Comments not showing

**Cause:** All comments are in "pending" status

**Fix:** Use moderation API to approve:

```bash
PUT /modules/graphql/comments/{uuid}/moderate
{"status": "approved"}
```

## Code Examples

### Rate a Post (Client-side)

```typescript
import { ratePost } from "../services/blogService";

const result = await ratePost(postId, 5);
if (result.success) {
  console.log("Average:", result.data.averageRating);
  console.log("Count:", result.data.ratingCount);
}
```

### Create Comment (Client-side)

```typescript
import { createComment } from "../services/blogService";

const result = await createComment(postId, {
  authorName: "John Doe",
  authorEmail: "john@example.com",
  body: "Great article!",
});

if (result.success) {
  alert("Comment submitted for moderation!");
}
```

### Get Comments (Client-side)

```typescript
import { getComments } from "../services/blogService";

const result = await getComments(postId);
if (result.success) {
  const approved = result.data.comments.filter((c) => c.status === "approved");
  console.log(`${approved.length} approved comments`);
}
```

## File Structure

```
blog-factory/
├── src/
│   ├── services/
│   │   └── blogService.ts          ← REST API client
│   └── components/
│       ├── Rating/
│       │   └── Rating.client.tsx   ← Uses blogService
│       └── Comments/
│           └── Comments.client.tsx ← Uses blogService
├── .env                            ← CSRF token (optional)
├── BLOG_SERVICE.md                 ← Full documentation
└── INTEGRATION_SUMMARY.md          ← Technical details
```

## What Changed

| Component      | Before           | After                   |
| -------------- | ---------------- | ----------------------- |
| Rating         | GraphQL mutation | REST API POST           |
| Comments       | GraphQL mutation | REST API POST + GET     |
| Error Handling | Basic            | User-friendly alerts    |
| Security       | None             | CSRF token required     |
| Data Loading   | None             | Loads comments on mount |

## Need Help?

1. Read full docs: `BLOG_SERVICE.md`
2. Check integration summary: `INTEGRATION_SUMMARY.md`
3. View API client code: `src/services/blogService.ts`
4. Check Jahia logs for backend errors
5. Use browser DevTools Network tab to debug API calls
