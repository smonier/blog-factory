import {
  AddResources,
  buildModuleFileUrl,
  buildNodeUrl,
  getNodeProps,
  jahiaComponent,
  Render,
} from "@jahia/javascript-modules-library";
import type { JCRNodeWrapper } from "org.jahia.services.content";
import type { Resource, RenderContext } from "org.jahia.services.render";
import { getMessageFromContext } from "../../lib/i18n";
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
    displayName: "Blog List",
    name: "default",
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
      return <div className={classes.root}>No blog content available</div>;
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
      console.error("[BlogList] Error getting page parameter:", e);
    }

    // Collect child posts
    const childNodes = getChildNodes(node);
    const posts = childNodes.filter((child) => {
      try {
        return child.getPrimaryNodeTypeName() === "blognt:post";
      } catch {
        return false;
      }
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
        console.error("[BlogList] Error building page URL:", e);
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
              <div className={classes.list}>
                {paginatedPosts.map((post) => (
                  <Render key={post.getIdentifier()} node={post} view="default" />
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
