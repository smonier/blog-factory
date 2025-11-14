import { useState, useEffect } from "react";
import { getRating } from "../../services/blogService";

type Props = {
  postId: string;
};

const CardRatingIsland = ({ postId }: Props) => {
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

  if (isLoading) {
    return <div style={{ opacity: 0.5, fontSize: "0.875rem" }}>⭐ Loading...</div>;
  }

  if (ratingCount === 0) {
    return <div style={{ opacity: 0.6, fontSize: "0.875rem" }}>No ratings yet</div>;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
      <span>
        {"★".repeat(Math.round(averageRating))}
        {"☆".repeat(5 - Math.round(averageRating))}
      </span>
      <span style={{ fontSize: "0.875rem", opacity: 0.8 }}>({ratingCount})</span>
    </div>
  );
};

export default CardRatingIsland;
