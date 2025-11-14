import {
  AddResources,
  buildModuleFileUrl,
  getNodeProps,
  jahiaComponent,
} from "@jahia/javascript-modules-library";
import type { JCRNodeWrapper } from "org.jahia.services.content";
import type { Resource } from "org.jahia.services.render";
import classes from "./AuthorCard.module.css";

type ServerContext = {
  currentResource?: Resource;
};

jahiaComponent(
  {
    nodeType: "blognt:author",
    componentType: "view",
    displayName: "Author Card",
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
      return <div className={classes.root}>Author information not available</div>;
    }

    const props = getNodeProps<{
      "jcr:title"?: string;
      "bio"?: string;
      "role"?: string;
      "avatar"?: JCRNodeWrapper;
      "socialLinks"?: string[];
    }>(node, ["jcr:title", "bio", "role", "avatar", "socialLinks"]);

    const name = props["jcr:title"] ?? "Anonymous";
    const bio = props.bio;
    const role = props.role;
    const socialLinks = Array.isArray(props.socialLinks) ? props.socialLinks : [];

    let avatarUrl: string | undefined;
    if (props.avatar) {
      try {
        avatarUrl = props.avatar.getUrl();
      } catch (e) {
        console.error("[AuthorCard] Error getting avatar URL:", e);
      }
    }

    return (
      <>
        <AddResources type="css" resources={buildModuleFileUrl("dist/assets/style.css")} />
        <div className={classes.root} itemScope itemType="https://schema.org/Person">
          {/* Row 1: Avatar + Name + Role */}
          <div className={classes.header}>
            {avatarUrl && (
              <div className={classes.avatarWrapper}>
                <img src={avatarUrl} alt={name} className={classes.avatar} itemProp="image" />
              </div>
            )}
            <div className={classes.headerText}>
              <h4 className={classes.name} itemProp="name">
                {name}
              </h4>
              {role && (
                <div className={classes.role} itemProp="jobTitle">
                  {role}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Bio */}
          {bio && (
            <div
              className={classes.bio}
              itemProp="description"
              dangerouslySetInnerHTML={{ __html: bio }}
            />
          )}

          {/* Row 3: Social Links */}
          {socialLinks.length > 0 && (
            <div className={classes.social}>
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  className={classes.socialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  itemProp="sameAs"
                >
                  {getLinkLabel(link)}
                </a>
              ))}
            </div>
          )}
        </div>
      </>
    );
  },
);

function getLinkLabel(url: string): string {
  if (url.includes("twitter.com") || url.includes("x.com")) return "Twitter";
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("github.com")) return "GitHub";
  if (url.includes("facebook.com")) return "Facebook";
  return "Website";
}
