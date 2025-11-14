import { useState, useEffect } from "react";
import { ratePost, getRating } from "../../services/blogService";
import classes from "./Rating.module.css";

type Props = {
  postId: string;
  averageRating: number;
  ratingCount: number;
  csrfToken?: string;
};

const RatingIsland = ({ postId, averageRating, ratingCount, csrfToken }: Props) => {
  // Guard against SSR
  if (typeof window === "undefined") {
    return null;
  }

  // Inject CSRF token into window if provided
  if (csrfToken && typeof window !== "undefined") {
    const win = window as Window & { contextJsParameters?: { csrfToken?: string } };
    win.contextJsParameters = win.contextJsParameters || {};
    win.contextJsParameters.csrfToken = csrfToken;
    console.log("[Rating] CSRF token injected from props:", csrfToken.substring(0, 10) + "...");
  }

  const [localRating, setLocalRating] = useState(averageRating);
  const [localCount, setLocalCount] = useState(ratingCount);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  // Fetch current rating from blog-service on mount
  useEffect(() => {
    const fetchRating = async () => {
      const result = await getRating(postId);
      if (result.success && result.data) {
        setLocalRating(result.data.averageRating);
        setLocalCount(result.data.ratingCount);
        console.log("[Rating] Fetched rating from blog-service:", result.data);
      } else {
        console.error("[Rating] Failed to fetch rating:", result.error);
      }
    };
    fetchRating();
  }, [postId]);

  const handleRate = async (rating: number) => {
    if (hasRated || isSubmitting) return;

    setIsSubmitting(true);
    setUserRating(rating);

    try {
      // Call blog-service API to rate post
      const result = await ratePost(postId, rating);

      if (result.success && result.data) {
        // Update with server response
        setLocalRating(result.data.averageRating);
        setLocalCount(result.data.ratingCount);
        setHasRated(true);

        console.log("[Rating] Successfully rated post:", { postId, rating });
      } else {
        console.error("[Rating] Failed to rate post:", result.error);
        setUserRating(null);
        alert(result.error || "Failed to submit rating. Please try again.");
      }
    } catch (error) {
      console.error("[Rating] Error rating post:", error);
      setUserRating(null);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= Math.round(localRating);
      stars.push(
        <button
          key={i}
          type="button"
          className={`${classes.star} ${filled ? classes.filled : ""} ${
            userRating === i ? classes.selected : ""
          }`}
          onClick={() => handleRate(i)}
          disabled={hasRated || isSubmitting}
          aria-label={`Rate ${i} stars`}
        >
          ★
        </button>,
      );
    }
    return stars;
  };

  return (
    <div className={classes.root}>
      <h3 className={classes.heading}>Rating</h3>
      <div className={classes.display}>
        <div className={classes.average}>
          {localRating > 0 ? localRating.toFixed(1) : "No ratings yet"}
        </div>
        <div className={classes.count}>
          {localCount} {localCount === 1 ? "rating" : "ratings"}
        </div>
      </div>
      <div className={classes.stars} role="group" aria-label="Rate this post">
        {renderStars()}
      </div>
      {hasRated && <p className={classes.thanks}>Thank you for rating!</p>}
    </div>
  );
};

export default RatingIsland;
