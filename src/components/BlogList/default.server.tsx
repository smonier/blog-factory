import {
  AddResources,
  buildModuleFileUrl,
  getNodeProps,
  jahiaComponent,
  RenderChildren,
} from "@jahia/javascript-modules-library";
import type { JCRNodeWrapper } from "org.jahia.services.content";
import type { Resource } from "org.jahia.services.render";
import classes from "./BlogList.module.css";

type ServerContext = {
  currentResource?: Resource;
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
    }>(node, ["jcr:title", "description"]);

    const title = props["jcr:title"] ?? "Blog";
    const description = props.description;

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

          <div className={classes.list}>
            <RenderChildren />
          </div>
        </div>
      </>
    );
  },
);
