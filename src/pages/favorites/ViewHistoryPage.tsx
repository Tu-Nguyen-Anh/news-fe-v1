import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useViewHistory } from "@/hooks/useArticles";
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

export default function ViewHistoryPage() {
  const [page, setPage] = useState(0);
  const { data, isPending, isError, refetch } = useViewHistory(page, PAGE_SIZE);

  const totalPages = data ? Math.ceil(data.amount / PAGE_SIZE) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
          <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6">
            <path d="M13 3a9 9 0 0 1 9 9H13V3zM11 3.05v9.45l-6.69 3.98A9 9 0 0 1 11 3.05zM3.91 17.65A9 9 0 0 0 21 12h-2a7 7 0 0 1-11.65 5.15l-3.44 2.05 1 1.68z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lịch sử đã xem</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isPending ? "Đang tải..." : `${data?.amount ?? 0} lượt xem`}
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
          <p className="font-medium text-red-600 dark:text-red-200">Không thể tải lịch sử xem</p>
          <button
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Thử lại
          </button>
        </div>
      ) : !data?.content.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-900/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-violet-300"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-100">Chưa có lịch sử xem</h3>
          <p className="mt-1 max-w-xs text-sm text-gray-500 dark:text-gray-400">
            Các bài viết bạn đã xem sẽ xuất hiện ở đây
          </p>
          <Link
            to="/articles"
            className="mt-5 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
          >
            Xem bài viết
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.content.map((item, idx) => (
              <li
                key={item.id}
                className="group overflow-hidden bg-white transition-all hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                <div className="flex gap-0">
                  {/* Accent bar with number */}
                  <div className="relative w-8 shrink-0 rounded-l-xl bg-gradient-to-b from-violet-400 to-purple-400">
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                      {page * PAGE_SIZE + idx + 1}
                    </span>
                  </div>

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
                        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-violet-600 dark:text-gray-100">
                          {item.title}
                        </h3>
                      </a>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                          {item.source_name}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200">
                          {item.topic_name}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-end justify-between gap-2">
                        <div className="space-y-0.5 text-xs text-gray-400 dark:text-gray-500">
                          <p className="flex items-center gap-1">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="h-3 w-3 text-violet-400"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span className="font-medium text-violet-500 dark:text-violet-300">Xem:</span>{" "}
                            {formatRelativeTime(item.viewed_at)}
                          </p>
                          <p>
                            <span className="font-medium text-gray-500 dark:text-gray-400">Đăng:</span>{" "}
                            {formatDate(item.pub_date)}
                          </p>
                        </div>

                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:border-violet-300 hover:bg-violet-100 dark:border-violet-900/50 dark:bg-violet-900/20 dark:text-violet-200 dark:hover:bg-violet-900/30"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          Xem lại
                        </a>
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
                          ? "bg-violet-500 text-white shadow-sm"
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
