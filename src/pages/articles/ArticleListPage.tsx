import { useEffect, useMemo, useRef, useState } from "react";
import { ArticleDetailBody } from "@/components/articles/ArticleDetailBody";
import { Modal } from "@/components/ui/Modal";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  useArticleDetail,
  useArticleFilterInfinite,
  useDeleteArticle,
  useFavoriteIds,
  useFavoriteStatus,
  useRecordView,
} from "@/hooks/useArticles";
import { FavoriteButton } from "@/components/articles/FavoriteButton";
import { CommentSection } from "@/components/articles/CommentSection";
import { useSourcesWithTopics } from "@/hooks/useSources";
import ArticleFormPage from "@/pages/articles/ArticleFormPage";
import type { Article, ArticleFilterRequest } from "@/types";
import { getArticleSourceLabel } from "@/utils/articleDisplay";
import { useUserStore } from "@/store/userStore";
import { isAdmin } from "@/utils/adminBadge";

const PAGE_SIZE = 10;
const KEYWORD_DEBOUNCE_MS = 500;

type ArticleViewMode = "grid" | "list" | "compact";

type DatePreset = "all" | "today" | "yesterday" | "3days" | "7days" | "1month";

type FilterState = {
  keyword: string;
  topicId: string;
  sourceId: string;
  datePreset: DatePreset;
};

const EMPTY_FILTER: FilterState = { keyword: "", topicId: "", sourceId: "", datePreset: "all" };

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "today", label: "Hôm nay" },
  { id: "yesterday", label: "Hôm qua" },
  { id: "3days", label: "3 ngày" },
  { id: "7days", label: "7 ngày" },
  { id: "1month", label: "1 tháng" },
];

/** Returns from/to in DD/MM/YYYY format for the given preset */
function getDateRange(preset: DatePreset): { from?: string; to?: string } {
  if (preset === "all") return {};
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = fmt(today);
  switch (preset) {
    case "today":
      return { from: todayStr, to: todayStr };
    case "yesterday": {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      const s = fmt(d);
      return { from: s, to: s };
    }
    case "3days": {
      const d = new Date(today);
      d.setDate(d.getDate() - 2);
      return { from: fmt(d), to: todayStr };
    }
    case "7days": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { from: fmt(d), to: todayStr };
    }
    case "1month": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { from: fmt(d), to: todayStr };
    }
  }
}

function formatDate(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function htmlToPlainText(html: string) {
  const safe = html ?? "";
  if (!safe.trim()) return "";

  // Khi chạy trong trình duyệt: dùng DOMParser để lấy textContent.
  // Khi không có DOM (ví dụ SSR/unit test): fallback regex đơn giản.
  if (typeof window === "undefined" || typeof document === "undefined") {
    return safe.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const el = document.createElement("div");
  el.innerHTML = safe;
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

const VIEW_OPTIONS: { id: ArticleViewMode; label: string }[] = [
  { id: "grid", label: "Lưới" },
  { id: "list", label: "Danh sách" },
  { id: "compact", label: "Rút gọn" },
];

type ArticleModal =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; id: number }
  | { kind: "detail"; id: number };

export default function ArticleListPage() {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTER);
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [viewMode, setViewMode] = useState<ArticleViewMode>("grid");
  const [modal, setModal] = useState<ArticleModal>({ kind: "none" });
  const [filterOpen, setFilterOpen] = useState(false);

  // Debounce keyword only — dropdowns & dates apply immediately
  useEffect(() => {
    const id = setTimeout(() => setDebouncedKeyword(filters.keyword.trim()), KEYWORD_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [filters.keyword]);

  const apiFilters = useMemo<Omit<ArticleFilterRequest, "page" | "size">>(() => {
    const req: Omit<ArticleFilterRequest, "page" | "size"> = {};
    if (debouncedKeyword) req.keyword = debouncedKeyword;
    if (filters.topicId) req.topic_id = Number(filters.topicId);
    if (filters.sourceId) req.source_id = Number(filters.sourceId);
    const { from, to } = getDateRange(filters.datePreset);
    if (from) req.from_pub_date = from;
    if (to) req.to_pub_date = to;
    return req;
  }, [debouncedKeyword, filters.topicId, filters.sourceId, filters.datePreset]);

  const hasActiveFilter =
    !!debouncedKeyword ||
    !!filters.topicId ||
    !!filters.sourceId ||
    filters.datePreset !== "all";

  const { data: sourcesWithTopics, isPending: sourcesLoading } = useSourcesWithTopics();
  const sources = sourcesWithTopics ?? [];
  const topics = useMemo(() => {
    if (!filters.sourceId) return sources.flatMap((s) => s.topics);
    return sources.find((s) => s.id === Number(filters.sourceId))?.topics ?? [];
  }, [sources, filters.sourceId]);

  const {
    data,
    isPending,
    isFetching,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useArticleFilterInfinite(apiFilters, PAGE_SIZE);

  // True khi filter thay đổi nhưng vẫn còn dữ liệu cũ (placeholderData đang hiện)
  const isFilterFetching = isFetching && !isPending && !isFetchingNextPage;
  const detailId = modal.kind === "detail" ? modal.id : 0;
  const { data: detailArticle, isPending: detailLoading } = useArticleDetail(detailId);
  const { data: isModalArticleFavorited, isPending: isCheckingFavorite } = useFavoriteStatus(detailId);
  const { data: favoriteIds, isPending: favoriteIdsPending } = useFavoriteIds(100);
  const recordView = useRecordView();
  const deleteMutation = useDeleteArticle();
  const closeModal = () => setModal({ kind: "none" });

  const currentUser = useUserStore((s) => s.user);
  const canManageArticles =
    !!currentUser && (isAdmin(currentUser.username) || isAdmin(currentUser.full_name));

  const articles = data?.pages.flatMap((p) => p.content) ?? [];
  const totalAmount = data?.pages[0]?.amount ?? 0;
  const errorMessage =
    (error as any)?.response?.data?.message ??
    (error as any)?.message ??
    "Có lỗi xảy ra khi tải danh sách bài viết.";

  // API detail không trả `topic_name`, nên lấy từ bài đang hiển thị trong list
  // hoặc fallback theo bộ lọc topic đang chọn.
  const selectedArticleFromList = modal.kind === "detail" ? articles.find((a) => Number(a.id) === modal.id) : undefined;
  const topicId = Number(filters.topicId);
  const topicNameFromFilter =
    Number.isFinite(topicId) && topicId > 0 ? topics.find((t) => t.id === topicId)?.name : undefined;

  const mergedDetailArticle = (() => {
    if (modal.kind !== "detail") return undefined;

    const detailTopicName = (detailArticle as any)?.topic_name as string | undefined;

    if (detailArticle) {
      return {
        ...(selectedArticleFromList ?? detailArticle),
        ...detailArticle,
        topic_name:
          detailTopicName ??
          selectedArticleFromList?.topic_name ??
          topicNameFromFilter ??
          "Chưa phân loại",
      } as Article;
    }

    return selectedArticleFromList;
  })();

  // Record view when detail modal opens
  useEffect(() => {
    if (detailId > 0) {
      recordView.mutate(detailId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailId]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Block when any fetch is in progress (filter change or next page already loading)
        if (entries[0]?.isIntersecting && hasNextPage && !isFetching) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, fetchNextPage]);

  const handleReset = () => {
    setFilters(EMPTY_FILTER);
    setDebouncedKeyword("");
  };

  const handleDelete = async (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageArticles) return;
    if (!confirm(`Xóa bài viết "${article.title}"?`)) return;
    await deleteMutation.mutateAsync(article.id);
  };

  const openDetail = (article: Article, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const id = Number(article.id);
    if (Number.isFinite(id) && id > 0) setModal({ kind: "detail", id });
  };

  const openEdit = (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageArticles) return;
    const id = Number(article.id);
    if (Number.isFinite(id) && id > 0) setModal({ kind: "edit", id });
  };

  function EyeIco({ s }: { s: number }) {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    );
  }

  function PenIco({ s }: { s: number }) {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    );
  }

  function DelIco({ s }: { s: number }) {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    );
  }

  function ActionBtn({
    title,
    color,
    icon,
    onClick,
    cls,
  }: {
    title: string;
    color: "blue" | "amber" | "red";
    icon: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
    cls?: string;
  }) {
    const colors: Record<string, string> = {
      blue: "text-indigo-500 hover:bg-indigo-50",
      amber: "text-amber-500 hover:bg-amber-50",
      red: "text-red-500 hover:bg-red-50",
    };
    return (
      <button
        type="button"
        title={title}
        onClick={onClick}
        className={`inline-flex items-center justify-center rounded-lg transition-colors ${colors[color]} ${cls ?? "p-1.5"}`}
      >
        {icon}
      </button>
    );
  }

  const renderActions = (article: Article, compact?: boolean) => {
    const size = compact ? 13 : 14;
    return (
      <div className="flex items-center gap-1 flex-shrink-0">
        <ActionBtn title="Xem" color="blue" cls={compact ? "p-1" : "p-1.5"} icon={<EyeIco s={size} />} onClick={(e) => openDetail(article, e)} />
        {canManageArticles && (
          <>
            <ActionBtn
              title="Sửa"
              color="amber"
              cls={compact ? "p-1" : "p-1.5"}
              icon={<PenIco s={size} />}
              onClick={(e) => openEdit(article, e)}
            />
            <ActionBtn
              title="Xóa"
              color="red"
              cls={compact ? "p-1" : "p-1.5"}
              icon={<DelIco s={size} />}
              onClick={(e) => void handleDelete(article, e)}
            />
          </>
        )}
      </div>
    );
  };

  const thumb = (article: Article, className: string) => (
    <SafeImage src={article.image_link} alt="" className={`rounded object-cover ${className}`} />
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 p-[1px]">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bài viết</h1>
            <p className="mt-0.5 text-sm text-gray-500">Quản lý toàn bộ bài viết thu thập</p>
          </div>
          <button
            type="button"
            disabled={!canManageArticles}
            onClick={() => { if (!canManageArticles) return; setModal({ kind: "create" }); }}
            className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-rose-700 hover:to-indigo-700 transition-colors ${
              !canManageArticles ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Thêm bài viết
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-slate-50 shadow-sm">
        {/* Mobile toggle */}
        <div className="flex items-center justify-between px-4 py-3 sm:hidden">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
          >
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
            </svg>
            Bộ lọc
            {hasActiveFilter && <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-blue-500" />}
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform ${filterOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {hasActiveFilter && (
            <button type="button" onClick={handleReset} className="text-xs text-gray-500 hover:text-red-500">
              Xóa lọc
            </button>
          )}
        </div>

        {/* Filter fields */}
        <div className={`${filterOpen ? "block" : "hidden"} border-t border-gray-100 p-4 sm:block sm:border-t-0`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Keyword */}
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-2">
              <label className="text-xs font-medium text-gray-600">Từ khóa</label>
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, mô tả..."
                value={filters.keyword}
                onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Source */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Nguồn tin</label>
              <select
                value={filters.sourceId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, sourceId: e.target.value, topicId: "" }))
                }
                disabled={sourcesLoading}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-wait disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">{sourcesLoading ? "Đang tải..." : "Tất cả nguồn"}</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Topic — filtered by selected source */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                Chủ đề{filters.sourceId ? ` (${sources.find((s) => s.id === Number(filters.sourceId))?.name ?? ""})` : ""}
              </label>
              <select
                value={filters.topicId}
                onChange={(e) => setFilters((f) => ({ ...f, topicId: e.target.value }))}
                disabled={sourcesLoading || topics.length === 0}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-wait disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {sourcesLoading ? "Đang tải..." : topics.length === 0 && filters.sourceId ? "Không có chủ đề" : "Tất cả chủ đề"}
                </option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Date preset */}
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">
              <label className="text-xs font-medium text-gray-600">Thời gian</label>
              <div className="flex flex-wrap gap-1.5">
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFilters((f) => ({ ...f, datePreset: p.id }))}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      filters.datePreset === p.id
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            {hasActiveFilter && (
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Xóa lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar: active filter chips + view mode */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {debouncedKeyword && (
            <FilterChip
              label={`"${debouncedKeyword}"`}
              onRemove={() => setFilters((f) => ({ ...f, keyword: "" }))}
            />
          )}
          {filters.topicId && (
            <FilterChip
              label={topics.find((t) => t.id === Number(filters.topicId))?.name ?? `Topic #${filters.topicId}`}
              onRemove={() => setFilters((f) => ({ ...f, topicId: "" }))}
            />
          )}
          {filters.sourceId && (
            <FilterChip
              label={sources.find((s) => s.id === Number(filters.sourceId))?.name ?? `Source #${filters.sourceId}`}
              onRemove={() => setFilters((f) => ({ ...f, sourceId: "" }))}
            />
          )}
          {filters.datePreset !== "all" && (
            <FilterChip
              label={DATE_PRESETS.find((p) => p.id === filters.datePreset)?.label ?? ""}
              onRemove={() => setFilters((f) => ({ ...f, datePreset: "all" }))}
            />
          )}
        </div>

        <div
          className="inline-flex rounded-lg border border-gray-200 bg-white/80 p-0.5 shadow-sm backdrop-blur"
          role="group"
          aria-label="Kiểu hiển thị"
        >
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setViewMode(opt.id)}
              aria-pressed={viewMode === opt.id}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === opt.id
                  ? "bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-indigo-50/70"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Article list */}
      <div className="relative overflow-x-auto overflow-y-visible rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Thin top bar: visible only when filter changes while old data is still showing */}
        {isFilterFetching && (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 rounded-t-2xl bg-gradient-to-r from-indigo-500 via-fuchsia-400 to-rose-500 animate-pulse" />
        )}
        <div className={`transition-opacity duration-150 ${isFilterFetching ? "opacity-60" : "opacity-100"}`}>
        {isError ? (
          <div className="p-10">
            <div className="mx-auto max-w-xl rounded-2xl border border-red-100 bg-red-50/60 p-6 text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-semibold text-red-700">Không thể tải danh sách bài viết</p>
              <p className="mt-1 text-sm text-red-600/90">{errorMessage}</p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        ) : isPending ? (
          <div className="p-10">
            <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-gradient-to-br from-indigo-50 via-fuchsia-50 to-rose-50 p-6">
              <div className="flex items-center justify-center gap-3 text-gray-700">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" aria-hidden />
                <div className="text-left">
                  <div className="text-sm font-semibold">Đang tải bài viết...</div>
                  <div className="text-xs text-gray-500">Chuẩn bị dữ liệu để hiển thị.</div>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="space-y-3 rounded-2xl border border-gray-100 bg-white/60 p-4">
                    <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-3 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 animate-pulse rounded bg-gray-100 w-11/12" />
                    <div className="h-3 animate-pulse rounded bg-gray-100 w-7/12" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : viewMode === "list" ? (
          <div className="min-w-0 overflow-x-auto">
            <table className="min-w-[52rem] w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["STT", "Thumbnail", "Tiêu đề", "Nguồn", "Chủ đề", "Ngày đăng", "Thao tác"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {articles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8">
                      <ArticlesEmptyState
                        hasActiveFilter={hasActiveFilter}
                        onCreate={() => setModal({ kind: "create" })}
                        onReset={handleReset}
                      />
                    </td>
                  </tr>
                )}
                {articles.map((article, i) => (
                  <tr
                    key={article.id}
                    className="group cursor-pointer hover:bg-indigo-50/40"
                    onClick={() => openDetail(article)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3">{thumb(article, "h-12 w-16")}</td>
                    <td className="max-w-[240px] px-4 py-3 text-sm font-medium text-gray-900">
                      <span className="line-clamp-2">{article.title || "—"}</span>
                    </td>
                    <td className="max-w-[140px] px-4 py-3 text-sm text-gray-600">
                      <span className="line-clamp-2" title={getArticleSourceLabel(article)}>{getArticleSourceLabel(article)}</span>
                    </td>
                    <td className="max-w-[140px] px-4 py-3 text-sm text-gray-600">
                      <span className="line-clamp-2" title={article.topic_name || ""}>{article.topic_name || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-500">{formatDate(article.pub_date)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <FavoriteButton
                          articleId={article.id}
                          initialFavorited={favoriteIds?.has(article.id) ?? false}
                          isLoading={favoriteIdsPending}
                          size="sm"
                        />
                        <div className="opacity-0 transition-opacity group-hover:opacity-100">
                          {renderActions(article)}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : viewMode === "grid" ? (
          articles.length === 0 ? (
            <ArticlesEmptyState
              hasActiveFilter={hasActiveFilter}
              onCreate={() => setModal({ kind: "create" })}
              onReset={handleReset}
            />
          ) : (
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, i) => (
                <article
                  key={article.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(article)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(article); } }}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <div className="relative w-full overflow-hidden bg-gradient-to-br from-indigo-100 via-fuchsia-100 to-rose-100/50">
                    {thumb(article, "h-40 w-full")}
                    <div className="absolute right-3 top-3 z-10">
                      <FavoriteButton
                        articleId={article.id}
                        initialFavorited={favoriteIds?.has(article.id) ?? false}
                        isLoading={favoriteIdsPending}
                        size="sm"
                      />
                    </div>
                    <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-white">
                      #{i + 1}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h2 className="line-clamp-2 text-sm leading-snug font-semibold text-gray-900">{article.title || "—"}</h2>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-500/10">
                        Nguồn: {getArticleSourceLabel(article)}
                      </span>
                      {article.topic_name && (
                        <span className="inline-flex items-center rounded-full bg-fuchsia-50 px-2 py-1 text-[11px] font-semibold text-fuchsia-700 ring-1 ring-inset ring-fuchsia-500/10">
                          Chủ đề: {article.topic_name}
                        </span>
                      )}
                    </div>
                    {article.description ? (
                      <p className="line-clamp-3 text-xs leading-relaxed text-gray-600">
                        {htmlToPlainText(article.description)}
                      </p>
                    ) : null}
                    <p className="text-xs text-gray-500">{formatDate(article.pub_date)}</p>
                    <div className="mt-auto border-t border-gray-100 pt-3 opacity-90 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                      {renderActions(article)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : (
          <ul className="divide-y divide-gray-100">
            {articles.length === 0 && (
              <li>
                <ArticlesEmptyState
                  hasActiveFilter={hasActiveFilter}
                  onCreate={() => setModal({ kind: "create" })}
                  onReset={handleReset}
                />
              </li>
            )}
            {articles.map((article, i) => (
              <li key={article.id} className="group flex items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-4">
                <div
                  role="button"
                  tabIndex={0}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md py-0.5 hover:bg-gray-50 sm:gap-3"
                  onClick={() => openDetail(article)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(article); } }}
                >
                  <span className="w-6 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-rose-600 py-0.5 text-center text-[11px] font-semibold text-white tabular-nums sm:w-8 sm:text-xs">
                    {i + 1}
                  </span>
                  {thumb(article, "h-8 w-11 flex-shrink-0 sm:h-9 sm:w-12")}
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-gray-900 sm:text-sm" title={article.title || ""}>
                      {article.title || "—"}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 sm:text-xs">
                      <span className="max-w-[42%] truncate" title={getArticleSourceLabel(article)}>{getArticleSourceLabel(article)}</span>
                      <span className="text-gray-300">·</span>
                      <span className="max-w-[42%] truncate" title={article.topic_name || ""}>{article.topic_name || "—"}</span>
                      <span className="hidden text-gray-300 sm:inline">·</span>
                      <span className="whitespace-nowrap">{formatDate(article.pub_date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <FavoriteButton
                      articleId={article.id}
                      initialFavorited={favoriteIds?.has(article.id) ?? false}
                      isLoading={favoriteIdsPending}
                      size="sm"
                    />
                    <div className="opacity-0 transition-opacity group-hover:opacity-100">
                      {renderActions(article, true)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!isPending && hasNextPage && <div ref={loadMoreRef} className="h-2 w-full shrink-0" aria-hidden />}
        {isFetchingNextPage && (
          <div className="border-t border-gray-100 py-4 text-center text-sm text-gray-500">Đang tải thêm...</div>
        )}
        </div>{/* end opacity wrapper */}
      </div>

      {!isPending && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            Tổng: {totalAmount} bản ghi
            {isFilterFetching && (
              <span className="inline-flex items-center gap-1 text-xs text-indigo-500">
                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                đang làm mới
              </span>
            )}
          </span>
          {articles.length > 0 && (
            <span className="text-gray-400">
              {hasNextPage ? "Cuộn xuống để tải thêm" : "Đã hiển thị toàn bộ danh sách"}
            </span>
          )}
        </div>
      )}

      <Modal
        open={modal.kind !== "none"}
        onClose={closeModal}
        className="max-h-[min(88dvh,52rem)] w-full max-w-[min(94vw,36rem)] overflow-y-auto p-5 sm:max-w-[min(92vw,42rem)] md:max-w-[min(88vw,48rem)]"
      >
        {modal.kind === "create" && (
          <ArticleFormPage
            mode="create"
            embedded
            onClose={closeModal}
            onSuccess={closeModal}
          />
        )}

        {modal.kind === "edit" && (
          <ArticleFormPage
            mode="edit"
            embedded
            recordId={modal.id}
            onClose={closeModal}
            onSuccess={closeModal}
          />
        )}

        {modal.kind === "detail" && (
          <>
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <h2 className="text-lg font-semibold text-gray-900">Chi tiết bài viết</h2>
              <div className="flex items-center gap-2">
                <FavoriteButton
                  articleId={modal.id}
                  initialFavorited={isModalArticleFavorited ?? false}
                  isLoading={isCheckingFavorite}
                  size="sm"
                />
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Đóng
                </button>
              </div>
            </div>
            <ArticleDetailBody
              article={mergedDetailArticle}
              isLoading={detailLoading}
              editArticleId={canManageArticles ? String(modal.id) : undefined}
            />
            <div className="mt-2 border-t border-gray-100 pt-4">
              <CommentSection articleId={modal.id} />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600/10 via-fuchsia-600/10 to-rose-600/10 px-2.5 py-1 text-xs font-semibold text-gray-800 ring-1 ring-inset ring-indigo-500/10">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-100/70"
        aria-label="Xóa bộ lọc"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

function ArticlesEmptyState({
  hasActiveFilter,
  onCreate,
  onReset,
}: {
  hasActiveFilter: boolean;
  onCreate: () => void;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-rose-600 text-white shadow-sm">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">Không có bài viết phù hợp</p>
        <p className="mt-1 text-sm text-gray-500">Thử thay đổi bộ lọc hoặc tạo bài viết mới.</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onCreate}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Tạo bài viết
        </button>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
}
