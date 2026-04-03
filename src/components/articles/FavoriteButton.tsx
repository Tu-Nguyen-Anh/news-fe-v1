import { useEffect, useState } from "react";
import { useAddFavorite, useRemoveFavorite } from "@/hooks/useArticles";
import { cn } from "@/utils/cn";

interface FavoriteButtonProps {
  articleId: number;
  initialFavorited?: boolean;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FavoriteButton({
  articleId,
  initialFavorited = false,
  isLoading = false,
  size = "md",
  className,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [pulse, setPulse] = useState(false);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  useEffect(() => {
    setIsFavorited(initialFavorited);
  }, [initialFavorited]);

  const isPending = addFavorite.isPending || removeFavorite.isPending;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending || isLoading) return;

    setPulse(true);
    setTimeout(() => setPulse(false), 350);

    if (isFavorited) {
      setIsFavorited(false);
      try {
        await removeFavorite.mutateAsync(articleId);
      } catch {
        setIsFavorited(true);
      }
    } else {
      setIsFavorited(true);
      try {
        await addFavorite.mutateAsync(articleId);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 409) {
          setIsFavorited(false);
        }
      }
    }
  };

  const sizeClasses = {
    sm: "h-7 w-7 p-1.5",
    md: "h-9 w-9 p-1.5",
    lg: "h-11 w-11 p-2",
  }[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending || isLoading}
      aria-label={isFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      aria-pressed={isFavorited}
      title={isFavorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1",
        isFavorited
          ? "bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600"
          : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-400",
        pulse && "scale-125",
        (isPending || isLoading) && "cursor-not-allowed opacity-50",
        sizeClasses,
        className,
      )}
    >
      {isLoading ? (
        <svg
          className="h-full w-full animate-spin text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" d="M12 2a10 10 0 1 0 10 10" />
        </svg>
      ) : isFavorited ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full drop-shadow-sm">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-full w-full"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )}
    </button>
  );
}
