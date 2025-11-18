import {
  AddResources,
  buildModuleFileUrl,
  buildNodeUrl,
  getNodeProps,
  jahiaComponent,
  Island,
} from "@jahia/javascript-modules-library";
import type { JCRNodeWrapper } from "org.jahia.services.content";
import type { Resource, RenderContext } from "org.jahia.services.render";
import { getMessageFromContext } from "../../lib/i18n";
import CardRatingIsland from "./CardRating.client";
import classes from "./BlogList.module.css";

type ServerContext = {
  currentResource?: Resource;
  renderContext?: RenderContext;
};

// Helper to get child nodes
const getChildNodes = (node: JCRNodeWrapper): JCRNodeWrapper[] => {
  try {
    if (!node || typeof node.getNodes !== "function") return [];
    const iterator = node.getNodes();
    const children: JCRNodeWrapper[] = [];
    while (iterator.hasNext()) {
      children.push(iterator.nextNode() as JCRNodeWrapper);
    }
    return children;
  } catch {
    return [];
  }
};

jahiaComponent(
  {
    nodeType: "blognt:blog",
    componentType: "view",
    displayName: "Blog List - Cards",
    name: "cards",
  },
  (_props, context: ServerContext) => {
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
      return (
        <div className={classes.root}>
          {getMessageFromContext("blog.error.notAvailable", context.renderContext)}
        </div>
      );
    }

    const props = getNodeProps<{
      "jcr:title"?: string;
      "description"?: string;
      "pageSize"?: number;
    }>(node, ["jcr:title", "description", "pageSize"]);

    const title = props["jcr:title"] ?? "Blog";
    const description = props.description;
    const pageSize = props.pageSize ?? 10;

    // Get current page from URL parameter (default to 1)
    let currentPage = 1;
    try {
      if (context.renderContext && typeof context.renderContext.getRequest === "function") {
        const request = context.renderContext.getRequest();
        if (request && typeof request.getParameter === "function") {
          const pageParam = request.getParameter("page");
          if (pageParam) {
            const parsedPage = parseInt(pageParam, 10);
            if (!isNaN(parsedPage) && parsedPage > 0) {
              currentPage = parsedPage;
            }
          }
        }
      }
    } catch (e) {
      console.error("[BlogList Cards] Error getting page parameter:", e);
    }

    // Collect child posts
    const childNodes = getChildNodes(node);
    const posts = childNodes
      .filter((child) => {
        try {
          return child.getPrimaryNodeTypeName() === "blognt:post";
        } catch {
          return false;
        }
      })
      .map((child) => {
        const postProps = getNodeProps<{
          "jcr:title"?: string;
          "excerpt"?: string;
          "slug"?: string;
          "datePublished"?: string;
          "author"?: JCRNodeWrapper;
          "image"?: JCRNodeWrapper;
          "ratingCount"?: number;
          "ratingTotal"?: number;
        }>(child, [
          "jcr:title",
          "excerpt",
          "slug",
          "datePublished",
          "author",
          "image",
          "ratingCount",
          "ratingTotal",
        ]);

        let postId = "";
        try {
          postId = child.getIdentifier();
        } catch (e) {
          console.error("[BlogList Cards] Error getting post ID:", e);
        }

        let authorName = "";
        if (postProps.author) {
          try {
            const authorProps = getNodeProps<{
              "jcr:title"?: string;
            }>(postProps.author, ["jcr:title"]);
            authorName = authorProps["jcr:title"] ?? "";
          } catch (e) {
            console.error("[BlogList Cards] Error reading author:", e);
          }
        }

        let imageUrl: string | undefined;
        const imageNode = postProps.image;
        if (imageNode && typeof imageNode.getUrl === "function") {
          try {
            imageUrl = imageNode.getUrl();
          } catch (e) {
            console.error("[BlogList Cards] Error getting image URL:", e);
          }
        }

        return {
          id: postId,
          node: child,
          title: postProps["jcr:title"] ?? "Untitled",
          excerpt: postProps.excerpt,
          slug: postProps.slug ?? "",
          datePublished: postProps.datePublished,
          authorName,
          imageUrl,
        };
      });

    // Pagination calculations
    const totalPosts = posts.length;
    const totalPages = Math.ceil(totalPosts / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPosts = posts.slice(startIndex, endIndex);

    // Generate pagination URL helper
    const getPageUrl = (page: number): string => {
      try {
        if (context.renderContext && typeof context.renderContext.getRequest === "function") {
          const request = context.renderContext.getRequest();
          if (request && typeof request.getRequestURI === "function") {
            const baseUrl = request.getRequestURI();
            return `${baseUrl}?page=${page}`;
          }
        }
      } catch (e) {
        console.error("[BlogList Cards] Error building page URL:", e);
      }
      return `?page=${page}`;
    };

    return (
      <>
        <AddResources type="css" resources={buildModuleFileUrl("dist/assets/style.css")} />
        <div className={classes.root}>
          <header className={classes.header}>
            <h1 className={classes.title}>{title}</h1>
            {description && (
              <div
                className={classes.description}
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </header>

          {totalPosts > 0 ? (
            <>
              <div className={classes.cardsGrid}>
                {paginatedPosts.map((post) => (
                  <article key={post.id} className={classes.card}>
                    {post.imageUrl && (
                      <div className={classes.cardImageWrapper}>
                        <img src={post.imageUrl} alt={post.title} className={classes.cardImage} />
                      </div>
                    )}

                    <h2 className={classes.cardTitle}>
                      <a href={buildNodeUrl(post.node)}>{post.title}</a>
                    </h2>

                    {post.excerpt && <p className={classes.cardExcerpt}>{post.excerpt}</p>}

                    <div className={classes.cardFooter}>
                      {post.authorName && (
                        <span className={classes.cardAuthor}>
                          {getMessageFromContext("blog.by", context.renderContext)}{" "}
                          {post.authorName}
                        </span>
                      )}

                      <div className={classes.cardRating}>
                        <Island
                          component={CardRatingIsland}
                          props={{
                            postId: post.id,
                          }}
                        />
                      </div>
                    </div>

                    <a href={buildNodeUrl(post.node)} className={classes.cardLink}>
                      {getMessageFromContext("blog.readMore", context.renderContext)} →
                    </a>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className={classes.pagination}>
                  {currentPage > 1 ? (
                    <a href={getPageUrl(currentPage - 1)} className={classes.paginationLink}>
                      &larr;{" "}
                      {getMessageFromContext("blog.previous", context.renderContext) || "Previous"}
                    </a>
                  ) : (
                    <span />
                  )}

                  <span className={classes.paginationInfo}>
                    {getMessageFromContext("blog.page", context.renderContext) || "Page"}{" "}
                    {currentPage} {getMessageFromContext("blog.of", context.renderContext) || "of"}{" "}
                    {totalPages}
                  </span>

                  {currentPage < totalPages ? (
                    <a href={getPageUrl(currentPage + 1)} className={classes.paginationLink}>
                      {getMessageFromContext("blog.next", context.renderContext) || "Next"} &rarr;
                    </a>
                  ) : (
                    <span />
                  )}
                </nav>
              )}
            </>
          ) : (
            <p className={classes.noPosts}>
              {getMessageFromContext("blog.noPosts", context.renderContext)}
            </p>
          )}
        </div>
      </>
    );
  },
);
