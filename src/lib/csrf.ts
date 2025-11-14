// Server-side utility to inject CSRF token into client context
// This should be used in your server components to pass the token to client islands

import type { Resource } from "org.jahia.services.render";

/**
 * Get CSRF token from environment or session
 * Use this in server components to pass token to client islands
 */
export function getServerCsrfToken(context?: { currentResource?: Resource }): string | null {
  // Try to get from server environment (build time)
  // @ts-expect-error - process.env may not be available
  if (typeof process !== "undefined" && process?.env?.BLOG_SERVICE_CSRF_TOKEN) {
    // @ts-expect-error - accessing process.env
    return process.env.BLOG_SERVICE_CSRF_TOKEN;
  }

  // Try to get from Jahia session (runtime)
  try {
    if (context?.currentResource) {
      const node = context.currentResource.getNode?.();
      const session = node?.getSession?.();
      const token = session?.getAttribute?.("X-CSRF-TOKEN");
      if (token) {
        return token;
      }
    }
  } catch (error) {
    console.warn("[CSRF] Could not get token from session:", error);
  }

  return null;
}

/**
 * Generate a script tag to inject CSRF token into the page
 * Add this to your page head or before closing body tag
 */
export function injectCsrfTokenScript(token: string | null): string {
  if (!token) {
    return "<!-- No CSRF token available -->";
  }

  return `<script>
    window.__CSRF_TOKEN__ = ${JSON.stringify(token)};
    const meta = document.createElement('meta');
    meta.name = 'csrf-token';
    meta.content = ${JSON.stringify(token)};
    document.head.appendChild(meta);
  </script>`;
}
