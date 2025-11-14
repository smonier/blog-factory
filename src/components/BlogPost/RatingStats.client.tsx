import { useState, useEffect } from "react";
import { getRating } from "../../services/blogService";
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRating = async () => {
      const result = await getRating(postId);
      if (result.success && result.data) {
        setAverageRating(result.data.averageRating);
        setRatingCount(result.data.ratingCount);
      }
      setIsLoading(false);
    };
    fetchRating();
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
    </>
  );
};

export default RatingStatsIsland;
