import { useEffect } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArticleDetailBody } from "@/components/articles/ArticleDetailBody";
import { FavoriteButton } from "@/components/articles/FavoriteButton";
import { CommentSection } from "@/components/articles/CommentSection";
import { useArticleDetail, useFavoriteStatus, useRecordView } from "@/hooks/useArticles";

export default function ArticleDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false }) as { id: string };
  const articleId = parseInt(id, 10);
  const { data: article, isPending } = useArticleDetail(Number.isFinite(articleId) ? articleId : 0);
  const { data: isFavorited, isPending: isCheckingFavorite } = useFavoriteStatus(articleId);
  const recordView = useRecordView();

  // Record view on mount (fire-and-forget)
  useEffect(() => {
    if (Number.isFinite(articleId) && articleId > 0) {
      recordView.mutate(articleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/articles" })}
            className="shrink-0 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Quay lại
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Chi tiết bài viết</h1>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton
            articleId={articleId}
            initialFavorited={isFavorited ?? false}
            isLoading={isCheckingFavorite}
            size="md"
          />
          <Link
            to="/articles/$id/edit"
            params={{ id }}
            className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
          >
            Sửa
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <ArticleDetailBody article={article} isLoading={isPending} />
      </div>

      {/* Comment section */}
      {Number.isFinite(articleId) && articleId > 0 && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <CommentSection articleId={articleId} />
        </div>
      )}
    </div>
  );
}
