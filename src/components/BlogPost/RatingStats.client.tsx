import { useState, useEffect } from "react";
import { getRating, getComments } from "../../services/blogService";
import { eventBus, EVENTS } from "../../lib/eventBus";
import classes from "./BlogPost.module.css";

type Props = {
  postId: string;
  type: "inline" | "stats";
};

const RatingStatsIsland = ({ postId, type }: Props) => {
  if (typeof window === "undefined") {
    return null;
  }

  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRating = async () => {
    const result = await getRating(postId);
    if (result.success && result.data) {
      setAverageRating(result.data.averageRating);
      setRatingCount(result.data.ratingCount);
    }
    setIsLoading(false);
  };

  const fetchCommentCount = async () => {
    const result = await getComments(postId);
    if (result.success && result.data) {
      setCommentCount(result.data.total);
    }
  };

  useEffect(() => {
    fetchRating();
    fetchCommentCount();
  }, [postId]);

  // Listen for rating and comment events to refresh stats
  useEffect(() => {
    const unsubscribeRating = eventBus.on(EVENTS.RATING_UPDATED, (data) => {
      const eventData = data as { postId: string } | undefined;
      if (eventData?.postId === postId) {
        console.log("[RatingStats] Rating updated event received, refreshing stats");
        fetchRating();
      }
    });

    const unsubscribeComment = eventBus.on(EVENTS.COMMENT_ADDED, (data) => {
      const eventData = data as { postId: string } | undefined;
      if (eventData?.postId === postId) {
        console.log("[RatingStats] Comment added event received, refreshing stats");
        fetchCommentCount();
      }
    });

    return () => {
      unsubscribeRating();
      unsubscribeComment();
    };
  }, [postId]);

  if (type === "inline") {
    if (isLoading) {
      return <span style={{ opacity: 0.5 }}>⭐ Loading...</span>;
    }
    if (ratingCount === 0) {
      return null;
    }
    return (
      <span>
        ⭐ {averageRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
      </span>
    );
  }

  // type === "stats"
  if (isLoading) {
    return (
      <div className={classes.fullPageStat} style={{ opacity: 0.5 }}>
        <div className={classes.fullPageStatValue}>...</div>
        <div className={classes.fullPageStatLabel}>Loading</div>
      </div>
    );
  }

  return (
    <>
      <div className={classes.fullPageStat}>
        <div className={classes.fullPageStatValue}>{ratingCount}</div>
        <div className={classes.fullPageStatLabel}>Ratings</div>
      </div>
      {averageRating > 0 && (
        <div className={classes.fullPageStat}>
          <div className={classes.fullPageStatValue}>{averageRating.toFixed(1)}</div>
          <div className={classes.fullPageStatLabel}>Average</div>
        </div>
      )}
      <div className={classes.fullPageStat}>
        <div className={classes.fullPageStatValue}>{commentCount}</div>
        <div className={classes.fullPageStatLabel}>Comments</div>
      </div>
    </>
  );
};

export default RatingStatsIsland;
