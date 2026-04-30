import { useEffect } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArticleDetailBody } from "@/components/articles/ArticleDetailBody";
import { FavoriteButton } from "@/components/articles/FavoriteButton";
import { CommentSection } from "@/components/articles/CommentSection";
import { useArticleDetail, useFavoriteStatus, useRecordView } from "@/hooks/useArticles";
import { useUserStore } from "@/store/userStore";
import { isAdmin } from "@/utils/adminBadge";

export default function ArticleDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false }) as { id: string };
  const articleId = parseInt(id, 10);
  const { data: article, isPending } = useArticleDetail(Number.isFinite(articleId) ? articleId : 0);
  const { data: isFavorited, isPending: isCheckingFavorite } = useFavoriteStatus(articleId);
  const recordView = useRecordView();

  const currentUser = useUserStore((s) => s.user);
  const canEdit = !!currentUser && (isAdmin(currentUser.username) || isAdmin(currentUser.full_name));

  useEffect(() => {
    if (Number.isFinite(articleId) && articleId > 0) {
      recordView.mutate(articleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Breadcrumb / toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/articles" })}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Danh sách bài viết
        </button>

        <div className="flex items-center gap-2">
          <FavoriteButton
            articleId={articleId}
            initialFavorited={isFavorited ?? false}
            isLoading={isCheckingFavorite}
            size="md"
          />
          {canEdit && (
            <Link
              to="/articles/$id/edit"
              params={{ id }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Chỉnh sửa
            </Link>
          )}
        </div>
      </div>

      {/* Article content */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <ArticleDetailBody article={article} isLoading={isPending} />
      </div>

      {/* Comments */}
      {Number.isFinite(articleId) && articleId > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-100">Bình luận</h2>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <CommentSection articleId={articleId} />
          </div>
        </div>
      )}
    </div>
  );
}
