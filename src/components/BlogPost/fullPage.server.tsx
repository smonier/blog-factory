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
import RatingStatsIsland from "./RatingStats.client";
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
    displayName: "Blog Post - Full Page",
    name: "fullPage",
  },
  (_props, context: ServerContext) => {
    const csrfToken = resolveCsrfToken(context.renderContext);

    // Debug: Log if token was found
    if (csrfToken) {
      console.log("[BlogPost/fullPage] CSRF token resolved:", csrfToken.substring(0, 10) + "...");
    } else {
      console.warn("[BlogPost/fullPage] No CSRF token found in renderContext!");
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
      "excerpt"?: string;
      "content"?: string;
      "datePublished"?: string;
      "dateModified"?: string;
      "j:tagList"?: string[];
      "author"?: JCRNodeWrapper;
      "image"?: JCRNodeWrapper;
      "ratingCount"?: number;
      "ratingTotal"?: number;
      "allowComments"?: boolean;
    }>(node, [
      "jcr:title",
      "excerpt",
      "content",
      "datePublished",
      "dateModified",
      "j:tagList",
      "author",
      "image",
      "ratingCount",
      "ratingTotal",
      "allowComments",
    ]);

    let postId = "";
    try {
      postId = node.getIdentifier();
    } catch (e) {
      console.error("[BlogPost FullPage] Error getting identifier:", e);
    }

    const title = props["jcr:title"] ?? "Untitled Post";
    const excerpt = props.excerpt;
    const content = props.content ?? "";
    const tags = Array.isArray(props["j:tagList"]) ? props["j:tagList"] : [];

    // Get author reference
    const authorNode = props.author;

    // Get image URL if available
    let imageUrl: string | undefined;
    const imageNode = props.image;
    if (imageNode && typeof imageNode.getUrl === "function") {
      try {
        imageUrl = imageNode.getUrl();
      } catch (e) {
        console.error("[BlogPost FullPage] Error getting image URL:", e);
      }
    }

    const datePublished = props.datePublished;
    const dateModified = props.dateModified;

    // Build inline script to inject CSRF token (same as poll module)
    const inlineContextScript = (() => {
      if (!csrfToken) {
        console.warn("[BlogPost/fullPage] No CSRF token to inject!");
        return null;
      }
      const script = [
        "window.contextJsParameters = window.contextJsParameters || {};",
        `window.contextJsParameters.csrfToken = ${JSON.stringify(csrfToken)};`,
      ].join(" ");
      console.log("[BlogPost/fullPage] Injecting CSRF token script");
      return script;
    })();

    return (
      <>
        <AddResources type="css" resources={buildModuleFileUrl("dist/assets/style.css")} />

        {inlineContextScript && <AddResources type="inline" resources={inlineContextScript} />}

        <article className={classes.fullPage} itemScope itemType="https://schema.org/BlogPosting">
          {/* Hero Image */}
          {imageUrl && (
            <div className={classes.fullPageHero}>
              <img
                src={imageUrl}
                alt={title}
                className={classes.fullPageHeroImage}
                itemProp="image"
              />
            </div>
          )}

          {/* Hero Section */}
          <header className={classes.fullPageHeader}>
            <div className={classes.fullPageContainer}>
              {tags.length > 0 && (
                <div className={classes.fullPageTags}>
                  {tags.map((tag) => (
                    <span key={tag} className={classes.fullPageTag} itemProp="keywords">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <h1 className={classes.fullPageTitle} itemProp="headline">
                {title}
              </h1>

              {excerpt && (
                <p className={classes.fullPageExcerpt} itemProp="description">
                  {excerpt}
                </p>
              )}

              <div className={classes.fullPageMeta}>
                {datePublished && (
                  <time
                    dateTime={datePublished}
                    itemProp="datePublished"
                    className={classes.fullPageDate}
                  >
                    📅 {formatDate(datePublished)}
                  </time>
                )}
                {dateModified && dateModified !== datePublished && (
                  <time
                    dateTime={dateModified}
                    itemProp="dateModified"
                    className={classes.fullPageDate}
                  >
                    ✏️ Updated {formatDate(dateModified)}
                  </time>
                )}
                <div className={classes.fullPageRating}>
                  <Island
                    component={RatingStatsIsland}
                    props={{
                      postId,
                      type: "inline",
                    }}
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className={classes.fullPageContainer}>
            <div className={classes.fullPageLayout}>
              {/* Article Content */}
              <div className={classes.fullPageContent}>
                <div
                  className={classes.fullPageArticle}
                  itemProp="articleBody"
                  dangerouslySetInnerHTML={{ __html: content }}
                />

                {/* Interactive Rating */}
                <aside className={classes.fullPageRatingWidget}>
                  <h3>Rate this post</h3>
                  <Island
                    component={RatingIsland}
                    props={{
                      postId,
                      averageRating: 0,
                      ratingCount: 0,
                      csrfToken,
                    }}
                  />
                </aside>

                {/* Comments Section */}
                {props.allowComments !== false && (
                  <aside className={classes.fullPageComments}>
                    <h3>Comments</h3>
                    <Island
                      component={CommentsIsland}
                      props={{
                        postId,
                        csrfToken,
                      }}
                    />
                  </aside>
                )}
              </div>

              {/* Sidebar */}
              <aside className={classes.fullPageSidebar}>
                {/* Author Card */}
                {authorNode && (
                  <div className={classes.fullPageAuthorBox}>
                    <h3 className={classes.fullPageSidebarTitle}>About the Author</h3>
                    <Render node={authorNode} view="default" />
                  </div>
                )}

                {/* Quick Stats */}
                <div className={classes.fullPageStats}>
                  <h3 className={classes.fullPageSidebarTitle}>Post Stats</h3>
                  <div className={classes.fullPageStatsGrid}>
                    <Island
                      component={RatingStatsIsland}
                      props={{
                        postId,
                        type: "stats",
                      }}
                    />
                  </div>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className={classes.fullPageTagsBox}>
                    <h3 className={classes.fullPageSidebarTitle}>Topics</h3>
                    <div className={classes.fullPageTagsList}>
                      {tags.map((tag) => (
                        <span key={tag} className={classes.fullPageSidebarTag}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </article>
      </>
    );
  },
);
