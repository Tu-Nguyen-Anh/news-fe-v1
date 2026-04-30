import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useFavorites, useRemoveFavorite } from "@/hooks/useArticles";
import { SafeImage } from "@/components/ui/SafeImage";
import { Spinner } from "@/components/ui/Spinner";

const PAGE_SIZE = 10;

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(ts: number) {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return formatDate(ts);
}

export default function FavoritesPage() {
  const [page, setPage] = useState(0);
  const { data, isPending, isError, refetch } = useFavorites(page, PAGE_SIZE);
  const removeFavorite = useRemoveFavorite();
  const [removingId, setRemovingId] = useState<number | null>(null);

  const totalPages = data ? Math.ceil(data.amount / PAGE_SIZE) : 0;

  const handleRemove = async (articleId: number, title: string) => {
    if (!confirm(`Bỏ yêu thích bài viết "${title}"?`)) return;
    setRemovingId(articleId);
    try {
      await removeFavorite.mutateAsync(articleId);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
        <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-rose-500 shadow-sm">
          <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bài viết yêu thích</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isPending ? "Đang tải..." : `${data?.amount ?? 0} bài viết`}
          </p>
        </div>
      </div>

      {/* Content */}
      {isPending ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-10 text-center dark:border-red-900/30 dark:bg-red-900/20">
          <p className="font-medium text-red-600 dark:text-red-300">Không thể tải danh sách yêu thích</p>
          <button
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Thử lại
          </button>
        </div>
      ) : !data?.content.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-red-300"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-100">Chưa có bài viết yêu thích</h3>
          <p className="mt-1 max-w-xs text-sm text-gray-500 dark:text-gray-400">
            Nhấn vào biểu tượng ♡ trên các bài viết để lưu vào đây
          </p>
          <Link
            to="/articles"
            className="mt-5 rounded-lg bg-rose-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-600"
          >
            Khám phá bài viết
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.content.map((item) => (
              <li
                key={item.id}
                className="group overflow-hidden bg-white transition-all hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
              <div className="flex gap-0">
                  {/* Accent bar */}
                  <div className="w-1 shrink-0 rounded-l-xl bg-gradient-to-b from-red-400 to-rose-300" />

                  <div className="flex flex-1 gap-3 p-4">
                    {/* Thumbnail */}
                    <div className="hidden shrink-0 sm:block">
                      {item.image_link ? (
                        <SafeImage
                          src={item.image_link}
                          alt=""
                          className="h-20 w-28 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-20 w-28 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="block"
                      >
                        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100">
                          {item.title}
                        </h3>
                      </a>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                          {item.source_name}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                          {item.topic_name}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-end justify-between gap-2">
                        <div className="space-y-0.5 text-xs text-gray-400 dark:text-gray-500">
                          <p>
                            <span className="font-medium text-gray-500 dark:text-gray-400">Đăng:</span>{" "}
                            {formatDate(item.pub_date)}
                          </p>
                          <p>
                            <span className="font-medium text-gray-500 dark:text-gray-400">Thêm:</span>{" "}
                            {formatRelativeTime(item.created_at)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleRemove(item.article_id, item.title)}
                          disabled={removingId === item.article_id}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                          title="Bỏ yêu thích"
                        >
                          {removingId === item.article_id ? (
                            <span className="animate-pulse">Đang xóa...</span>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                              </svg>
                              Bỏ yêu thích
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                ← Trước
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum =
                    totalPages <= 5
                      ? i
                      : page < 3
                        ? i
                        : page >= totalPages - 3
                          ? totalPages - 5 + i
                          : page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                        pageNum === page
                          ? "bg-red-500 text-white shadow-sm"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Tiếp →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
