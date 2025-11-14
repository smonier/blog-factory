// Blog Service API Client
// Communicates with blog-service module via GraphQL extensions

const GRAPHQL_ENDPOINT = "/modules/graphql";

/**
 * Normalize token value - handle string/null/undefined
 */
const normalizeToken = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Read CSRF token from environment variables (same pattern as poll module)
 */
const readEnvCsrfToken = (): string | null => {
  try {
    const envRecord = (import.meta as unknown as { env?: Record<string, unknown> })?.env ?? {};
    const candidates = [
      envRecord["csrfToken"],
      envRecord["csrftoken"],
      envRecord["CSRFTOKEN"],
      envRecord["CSRF_TOKEN"],
      envRecord["VITE_CSRF_TOKEN"],
    ];
    for (const candidate of candidates) {
      const token = normalizeToken(candidate);
      if (token) return token;
    }
  } catch {
    // ignore access issues, will fallback to runtime value
  }
  return null;
};

/**
 * Get CSRF token from environment or runtime context
 * Priority: env variables -> window.contextJsParameters
 */
const getCsrfToken = (): string | null => {
  // Debug: Log what we're checking
  console.log("[BlogService] Checking for CSRF token...");
  console.log("[BlogService] import.meta.env:", (import.meta as { env?: unknown })?.env);

  // Check environment first
  const envToken = readEnvCsrfToken();
  if (envToken) {
    console.log(
      "[BlogService] ✅ CSRF token found in environment:",
      envToken.substring(0, 10) + "...",
    );
    return envToken;
  }

  // Fallback to window context (Jahia contextJsParameters)
  if (typeof window === "undefined") {
    console.warn("[BlogService] Window is undefined (SSR context)");
    return null;
  }

  // Debug: Check what's in window
  console.log(
    "[BlogService] window.contextJsParameters:",
    (window as { contextJsParameters?: unknown }).contextJsParameters,
  );

  const contextToken = normalizeToken(
    (window as { contextJsParameters?: { csrfToken?: string } }).contextJsParameters?.csrfToken,
  );
  if (contextToken) {
    console.log(
      "[BlogService] ✅ CSRF token found in window.contextJsParameters:",
      contextToken.substring(0, 10) + "...",
    );
    return contextToken;
  }

  console.error("[BlogService] ❌ CSRF token not found! Checked:", {
    env: "not found",
    windowContextJsParameters: (window as { contextJsParameters?: unknown }).contextJsParameters,
  });
  return null;
};

// Generic GraphQL query/mutation wrapper
async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const csrfToken = getCsrfToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add CSRF token to headers (use X-CSRF-Token like poll module)
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
      console.log("[BlogService] CSRF token added to headers:", csrfToken.substring(0, 10) + "...");
      console.log("[BlogService] All headers:", headers);
    } else {
      console.error("[BlogService] ❌ NO CSRF TOKEN AVAILABLE - REQUEST WILL FAIL!");
      console.error("[BlogService] Debug info:", {
        windowExists: typeof window !== "undefined",
        contextJsParameters:
          typeof window !== "undefined"
            ? (window as { contextJsParameters?: unknown }).contextJsParameters
            : "N/A",
        importMetaEnv: (import.meta as { env?: unknown })?.env,
      });
    }

    console.log(`[BlogService] GraphQL request to ${GRAPHQL_ENDPOINT}`);
    console.log(`[BlogService] Query:`, query);
    console.log(`[BlogService] Variables:`, variables);

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BlogService] HTTP error (${response.status}):`, errorText);
      return {
        success: false,
        error: `Request failed with status ${response.status}: ${errorText}`,
      };
    }

    const result = await response.json();
    console.log(`[BlogService] Response:`, result);

    if (result.errors) {
      console.error(`[BlogService] GraphQL errors:`, result.errors);
      return {
        success: false,
        error: result.errors.map((e: { message: string }) => e.message).join(", "),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error(`[BlogService] Network error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
// ============================================================================
// RATING SERVICE
// ============================================================================

export type RatingResponse = {
  postId: string;
  averageRating: number;
  ratingCount: number;
};

/**
 * Submit a rating for a blog post
 * @param postId - The UUID of the blog post
 * @param rating - Rating value (1-5)
 */
export async function ratePost(
  postId: string,
  rating: number,
): Promise<{ success: boolean; data?: RatingResponse; error?: string }> {
  if (rating < 1 || rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5" };
  }

  const mutation = `
    mutation RatePost($postId: String!, $rating: Int!) {
      blog {
        ratePost(postId: $postId, rating: $rating) {
          postId
          averageRating
          ratingCount
        }
      }
    }
  `;

  const result = await graphqlRequest<{ blog: { ratePost: RatingResponse } }>(mutation, {
    postId,
    rating,
  });

  if (result.success && result.data) {
    return { success: true, data: result.data.blog.ratePost };
  }

  return { success: false, error: result.error };
}

/**
 * Get rating statistics for a blog post
 * @param postId - The UUID of the blog post
 */
export async function getRating(
  postId: string,
): Promise<{ success: boolean; data?: RatingResponse; error?: string }> {
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

  const result = await graphqlRequest<{ blog: { getRating: RatingResponse } }>(query, {
    postId,
  });

  if (result.success && result.data) {
    return { success: true, data: result.data.blog.getRating };
  }

  return { success: false, error: result.error };
}

// ============================================================================
// COMMENT SERVICE
// ============================================================================

export type Comment = {
  uuid: string;
  authorName: string;
  authorEmail?: string;
  body: string;
  created: string;
  status: "pending" | "approved" | "rejected";
};

export type CommentResponse = {
  uuid: string;
  status: string;
  message: string;
};

export type CommentsListResponse = {
  postId: string;
  comments: Comment[];
  total: number;
};

/**
 * Get approved comments for a blog post
 * @param postId - The UUID of the blog post
 */
export async function getComments(
  postId: string,
): Promise<{ success: boolean; data?: CommentsListResponse; error?: string }> {
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

  const result = await graphqlRequest<{ blog: { getComments: CommentsListResponse } }>(query, {
    postId,
  });

  if (result.success && result.data) {
    return { success: true, data: result.data.blog.getComments };
  }

  return { success: false, error: result.error };
}

/**
 * Submit a new comment for a blog post
 * @param postId - The UUID of the blog post
 * @param comment - Comment data (authorName, authorEmail, body)
 */
export async function createComment(
  postId: string,
  comment: {
    authorName: string;
    authorEmail: string;
    body: string;
  },
): Promise<{ success: boolean; data?: CommentResponse; error?: string }> {
  const mutation = `
    mutation CreateComment($postId: String!, $authorName: String!, $authorEmail: String!, $body: String!) {
      blog {
        createComment(postId: $postId, authorName: $authorName, authorEmail: $authorEmail, body: $body) {
          uuid
          status
          message
        }
      }
    }
  `;

  const result = await graphqlRequest<{ blog: { createComment: CommentResponse } }>(mutation, {
    postId,
    authorName: comment.authorName,
    authorEmail: comment.authorEmail,
    body: comment.body,
  });

  if (result.success && result.data) {
    return { success: true, data: result.data.blog.createComment };
  }

  return { success: false, error: result.error };
}

/**
 * Moderate a comment (approve/reject) - Admin only
 * @param commentId - The UUID of the comment
 * @param status - New status: 'approved' or 'rejected'
 */
export async function moderateComment(
  commentId: string,
  status: "approved" | "rejected",
): Promise<{ success: boolean; data?: CommentResponse; error?: string }> {
  const mutation = `
    mutation ModerateComment($commentId: String!, $status: String!) {
      blog {
        moderateComment(commentId: $commentId, status: $status) {
          uuid
          status
          message
        }
      }
    }
  `;

  const result = await graphqlRequest<{ blog: { moderateComment: CommentResponse } }>(mutation, {
    commentId,
    status,
  });

  if (result.success && result.data) {
    return { success: true, data: result.data.blog.moderateComment };
  }

  return { success: false, error: result.error };
}
