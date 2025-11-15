import { useState, useEffect } from "react";
import { getComments, createComment, type Comment } from "../../services/blogService";
import { eventBus, EVENTS } from "../../lib/eventBus";
import classes from "./Comments.module.css";

type Props = {
  postId: string;
  initialComments?: Comment[];
  csrfToken?: string;
  locale?: string;
};

// Import locale files
import enLocale from "../../../settings/locales/en.json";
import frLocale from "../../../settings/locales/fr.json";
import esLocale from "../../../settings/locales/es.json";
import deLocale from "../../../settings/locales/de.json";

const locales: Record<string, Record<string, string>> = {
  en: enLocale as Record<string, string>,
  fr: frLocale as Record<string, string>,
  es: esLocale as Record<string, string>,
  de: deLocale as Record<string, string>,
};

const getMessage = (key: string, locale: string = "en"): string => {
  const messages = locales[locale] || locales.en;
  return messages[key] || key;
};

const EMPTY_COMMENTS: Comment[] = [];

const CommentsIsland = ({ postId, initialComments, csrfToken, locale = "en" }: Props) => {
  // Guard against SSR
  if (typeof window === "undefined") {
    return null;
  }

  // Inject CSRF token into window if provided
  if (csrfToken && typeof window !== "undefined") {
    const win = window as Window & { contextJsParameters?: { csrfToken?: string } };
    win.contextJsParameters = win.contextJsParameters || {};
    win.contextJsParameters.csrfToken = csrfToken;
    console.log("[Comments] CSRF token injected from props:", csrfToken.substring(0, 10) + "...");
  }

  const [comments, setComments] = useState<Comment[]>(initialComments ?? EMPTY_COMMENTS);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load comments on mount if not provided
  useEffect(() => {
    if (!initialComments || initialComments.length === 0) {
      loadComments();
    }
  }, [postId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const result = await getComments(postId);
      if (result.success && result.data) {
        setComments(result.data.comments);
      } else {
        console.error("[Comments] Failed to load comments:", result.error);
      }
    } catch (error) {
      console.error("[Comments] Error loading comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();

    if (!authorName.trim() || !authorEmail.trim() || !body.trim()) {
      setMessage({ type: "error", text: getMessage("blog.commentRequired", locale) });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Call blog-service API to create comment
      const result = await createComment(postId, {
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim(),
        body: body.trim(),
      });

      if (result.success && result.data) {
        // Show success message
        setMessage({
          type: "success",
          text: getMessage("blog.commentPending", locale),
        });

        // Clear form
        setAuthorName("");
        setAuthorEmail("");
        setBody("");

        console.log("[Comments] Successfully submitted comment:", result.data);

        // If comment was approved immediately (no moderation), emit event to update stats
        if (result.data.status === "approved") {
          console.log("[Comments] Comment approved immediately, emitting event");
          eventBus.emit(EVENTS.COMMENT_ADDED, { postId });
          // Reload comments to show the new one
          loadComments();
        }
      } else {
        setMessage({
          type: "error",
          text: result.error || getMessage("blog.commentError", locale),
        });
      }
    } catch (error) {
      console.error("[Comments] Error submitting comment:", error);
      setMessage({ type: "error", text: getMessage("blog.commentError", locale) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const approvedComments = comments.filter((c) => c.status.toLowerCase() === "approved");

  return (
    <div className={classes.root}>
      <h3 className={classes.heading}>
        {getMessage("blog.comments", locale)} ({isLoading ? "..." : approvedComments.length})
      </h3>

      {approvedComments.length > 0 && (
        <ul className={classes.list}>
          {approvedComments.map((comment) => (
            <li key={comment.uuid} className={classes.comment}>
              <div className={classes.commentHeader}>
                <strong className={classes.commentAuthor}>{comment.authorName}</strong>
                <time className={classes.commentDate}>{formatDate(comment.created)}</time>
              </div>
              <div
                className={classes.commentBody}
                dangerouslySetInnerHTML={{ __html: comment.body }}
              />
            </li>
          ))}
        </ul>
      )}

      <div className={classes.formSection}>
        <h4 className={classes.formHeading}>{getMessage("blog.addComment", locale)}</h4>

        <form onSubmit={handleSubmit} className={classes.form}>
          <div className={classes.formGroup}>
            <label htmlFor="comment-name" className={classes.label}>
              {getMessage("blog.commentName", locale)} *
            </label>
            <input
              id="comment-name"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className={classes.input}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={classes.formGroup}>
            <label htmlFor="comment-email" className={classes.label}>
              {getMessage("blog.commentEmail", locale)} *{" "}
              {getMessage("blog.commentEmailNote", locale)}
            </label>
            <input
              id="comment-email"
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              className={classes.input}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={classes.formGroup}>
            <label htmlFor="comment-body" className={classes.label}>
              {getMessage("blog.commentBody", locale)} *
            </label>
            <textarea
              id="comment-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={classes.textarea}
              rows={5}
              required
              disabled={isSubmitting}
            />
          </div>

          {message && (
            <div
              className={`${classes.message} ${
                message.type === "error" ? classes.error : classes.success
              }`}
            >
              {message.text}
            </div>
          )}

          <button type="submit" className={classes.submit} disabled={isSubmitting}>
            {isSubmitting
              ? getMessage("blog.submitting", locale)
              : getMessage("blog.submit", locale)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommentsIsland;
