import {
  AddResources,
  buildModuleFileUrl,
  getNodeProps,
  jahiaComponent,
  Island,
  Render,
} from "@jahia/javascript-modules-library";
import type { JCRNodeWrapper } from "org.jahia.services.content";
import type { Resource, RenderContext } from "org.jahia.services.render";
import RatingIsland from "../Rating/Rating.client";
import CommentsIsland from "../Comments/Comments.client";
import classes from "./BlogPost.module.css";

type ServerContext = {
  currentResource?: Resource;
  renderContext?: RenderContext;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

/**
 * Normalize token value (same as poll module)
 */
const normalizeToken = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  try {
    if (typeof (value as { getToken?: () => unknown }).getToken === "function") {
      const token = (value as { getToken: () => unknown }).getToken();
      const asString = token != null ? String(token).trim() : "";
      return asString ? asString : undefined;
    }
  } catch {
    // ignore
  }

  try {
    const tokenProp =
      (value as { token?: unknown })?.token ??
      (value as { value?: unknown })?.value ??
      (value as { csrfToken?: unknown })?.csrfToken ??
      (value as { getValue?: () => unknown })?.getValue?.();
    if (typeof tokenProp === "string") {
      const trimmed = tokenProp.trim();
      if (trimmed) return trimmed;
    }
  } catch {
    // ignore
  }

  return undefined;
};

/**
 * Resolve CSRF token from request/session (same as poll module)
 */
const resolveCsrfToken = (ctx?: RenderContext): string | undefined => {
  try {
    const request = typeof ctx?.getRequest === "function" ? ctx.getRequest() : undefined;
    if (!request) return undefined;

    const session =
      typeof request.getSession === "function"
        ? request.getSession(false) || request.getSession()
        : undefined;

    const candidates: Array<unknown> = [];
    try {
      if (typeof request.getAttribute === "function") {
        candidates.push(
          request.getAttribute("org.springframework.security.web.csrf.CsrfToken"),
          request.getAttribute("_csrf"),
          request.getAttribute("csrfToken"),
        );
      }
    } catch {
      // ignore
    }

    try {
      if (session && typeof session.getAttribute === "function") {
        candidates.push(
          session.getAttribute("org.springframework.security.web.csrf.CsrfToken"),
          session.getAttribute("_csrf"),
          session.getAttribute("csrfToken"),
        );
      }
    } catch {
      // ignore
    }

    for (const candidate of candidates) {
      const token = normalizeToken(candidate);
      if (token) {
        return token;
      }
    }
  } catch (error) {
    console.warn("[BlogPost] Unable to resolve CSRF token", error);
  }
  return undefined;
};

jahiaComponent(
  {
    nodeType: "blognt:post",
    componentType: "view",
    displayName: "Blog Post",
    name: "default",
  },
  (_props, context: ServerContext) => {
    const csrfToken = resolveCsrfToken(context.renderContext);

    // Debug: Log if token was found
    if (csrfToken) {
      console.log("[BlogPost] CSRF token resolved:", csrfToken.substring(0, 10) + "...");
    } else {
      console.warn("[BlogPost] No CSRF token found in renderContext!");
    }

    const node = (() => {
      try {
        if (!context.currentResource || typeof context.currentResource.getNode !== "function") {
          return null;
        }
        return context.currentResource.getNode() as JCRNodeWrapper;
      } catch {
        return null;
      }
    })();

    if (!node) {
      return <div className={classes.root}>Post not available</div>;
    }

    const props = getNodeProps<{
      "jcr:title"?: string;
      "slug"?: string;
      "content"?: string;
      "excerpt"?: string;
      "datePublished"?: string;
      "dateModified"?: string;
      "j:tagList"?: string[];
      "author"?: JCRNodeWrapper;
      "ratingCount"?: number;
      "ratingTotal"?: number;
      "allowComments"?: boolean;
    }>(node, [
      "jcr:title",
      "slug",
      "content",
      "excerpt",
      "datePublished",
      "dateModified",
      "j:tagList",
      "author",
      "ratingCount",
      "ratingTotal",
      "allowComments",
    ]);

    let postId = "";
    try {
      postId = node.getIdentifier();
    } catch (e) {
      console.error("[BlogPost] Error getting identifier:", e);
    }

    const title = props["jcr:title"] ?? "Untitled Post";
    const content = props.content ?? "";
    const tags = Array.isArray(props["j:tagList"]) ? props["j:tagList"] : [];

    // Calculate average rating
    const ratingCount = props.ratingCount ?? 0;
    const ratingTotal = props.ratingTotal ?? 0;
    const averageRating = ratingCount > 0 ? ratingTotal / ratingCount : 0;

    // Get author reference
    const authorNode = props.author;

    const datePublished = props.datePublished;
    const dateModified = props.dateModified;

    // Build inline script to inject CSRF token (same as poll module)
    const inlineContextScript = (() => {
      if (!csrfToken) {
        console.warn("[BlogPost] No CSRF token to inject!");
        return null;
      }
      const script = [
        "window.contextJsParameters = window.contextJsParameters || {};",
        `window.contextJsParameters.csrfToken = ${JSON.stringify(csrfToken)};`,
      ].join(" ");
      console.log("[BlogPost] Injecting CSRF token script");
      return script;
    })();

    return (
      <>
        <AddResources type="css" resources={buildModuleFileUrl("dist/assets/style.css")} />

        {inlineContextScript && <AddResources type="inline" resources={inlineContextScript} />}

        <article className={classes.root} itemScope itemType="https://schema.org/BlogPosting">
          <header className={classes.header}>
            <h1 className={classes.title} itemProp="headline">
              {title}
            </h1>

            <div className={classes.meta}>
              {props.datePublished && (
                <time dateTime={props.datePublished} itemProp="datePublished">
                  Published {formatDate(props.datePublished)}
                </time>
              )}
              {props.dateModified && props.dateModified !== props.datePublished && (
                <time dateTime={props.dateModified} itemProp="dateModified">
                  Updated {formatDate(props.dateModified)}
                </time>
              )}
            </div>

            {tags.length > 0 && (
              <div className={classes.tags}>
                {tags.map((tag) => (
                  <span key={tag} className={classes.tag} itemProp="keywords">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div
            className={classes.content}
            itemProp="articleBody"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {authorNode && (
            <aside className={classes.authorCard}>
              <h3>About the Author</h3>
              <Render node={authorNode} view="default" />
            </aside>
          )}

          <aside className={classes.rating}>
            <Island
              component={RatingIsland}
              props={{
                postId,
                averageRating,
                ratingCount,
                csrfToken,
              }}
            />
          </aside>

          {props.allowComments !== false && (
            <aside className={classes.comments}>
              <Island
                component={CommentsIsland}
                props={{
                  postId,
                  csrfToken,
                }}
              />
            </aside>
          )}
        </article>
      </>
    );
  },
);
