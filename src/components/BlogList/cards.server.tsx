import {
  AddResources,
  buildModuleFileUrl,
  buildNodeUrl,
  getNodeProps,
  jahiaComponent,
  Island,
} from "@jahia/javascript-modules-library";
import type { JCRNodeWrapper } from "org.jahia.services.content";
import type { Resource } from "org.jahia.services.render";
import CardRatingIsland from "./CardRating.client";
import classes from "./BlogList.module.css";

type ServerContext = {
  currentResource?: Resource;
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
      return <div className={classes.root}>No blog content available</div>;
    }

    const props = getNodeProps<{
      "jcr:title"?: string;
      "description"?: string;
    }>(node, ["jcr:title", "description"]);

    const title = props["jcr:title"] ?? "Blog";
    const description = props.description;

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
          "ratingCount"?: number;
          "ratingTotal"?: number;
        }>(child, [
          "jcr:title",
          "excerpt",
          "slug",
          "datePublished",
          "author",
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

        return {
          id: postId,
          node: child,
          title: postProps["jcr:title"] ?? "Untitled",
          excerpt: postProps.excerpt,
          slug: postProps.slug ?? "",
          datePublished: postProps.datePublished,
          authorName,
        };
      });

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

          {posts.length > 0 ? (
            <div className={classes.cardsGrid}>
              {posts.map((post) => (
                <article key={post.id} className={classes.card}>
                  <h2 className={classes.cardTitle}>
                    <a href={buildNodeUrl(post.node)}>{post.title}</a>
                  </h2>

                  {post.excerpt && <p className={classes.cardExcerpt}>{post.excerpt}</p>}

                  <div className={classes.cardFooter}>
                    {post.authorName && (
                      <span className={classes.cardAuthor}>by {post.authorName}</span>
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
                    Read more →
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <p className={classes.noPosts}>No posts available.</p>
          )}
        </div>
      </>
    );
  },
);
