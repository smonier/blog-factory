/**
 * Server-side GraphQL client for blog-service
 * Fetches ratings and comments from Live workspace
 */

const GRAPHQL_ENDPOINT = "http://localhost:8080/modules/graphql";

interface RatingResponse {
  postId: string;
  averageRating: number;
  ratingCount: number;
}

interface Comment {
  uuid: string;
  authorName: string;
  body: string;
  created: string;
  status: string;
}

interface CommentsResponse {
  postId: string;
  comments: Comment[];
  total: number;
}

async function serverGraphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  csrfToken?: string,
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const result = await response.json();

    if (result.errors) {
      return {
        success: false,
        error: result.errors[0]?.message || "GraphQL error",
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch rating stats for a blog post from Live workspace
 */
export async function getServerRating(
  postId: string,
  csrfToken?: string,
): Promise<{ averageRating: number; ratingCount: number }> {
  const query = `
    query GetRating($postId: String!) {
      blog {
        getRating(postId: $postId) {
          postId
          averageRating
          ratingCount
        }
      }
    }
  `;

  const result = await serverGraphqlRequest<{ blog: { getRating: RatingResponse } }>(
    query,
    { postId },
    csrfToken,
  );

  if (result.success && result.data) {
    return {
      averageRating: result.data.blog.getRating.averageRating,
      ratingCount: result.data.blog.getRating.ratingCount,
    };
  }

  // Return defaults on error
  return { averageRating: 0, ratingCount: 0 };
}

/**
 * Fetch approved comments for a blog post from Live workspace
 */
export async function getServerComments(postId: string, csrfToken?: string): Promise<Comment[]> {
  const query = `
    query GetComments($postId: String!) {
      blog {
        getComments(postId: $postId) {
          postId
          comments {
            uuid
            authorName
            body
            created
            status
          }
          total
        }
      }
    }
  `;

  const result = await serverGraphqlRequest<{ blog: { getComments: CommentsResponse } }>(
    query,
    { postId },
    csrfToken,
  );

  if (result.success && result.data) {
    // Filter only approved comments
    return result.data.blog.getComments.comments.filter((comment) => comment.status === "approved");
  }

  return [];
}
