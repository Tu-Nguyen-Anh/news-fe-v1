import { useEffect, useRef, useState } from "react";
import { useBlogFeed } from "@/hooks/useBlog";
import { PostCard } from "@/components/blog/PostCard";
import { PostFormModal } from "@/components/blog/PostFormModal";
import { BlogPostDetailModal } from "@/components/blog/BlogPostDetailModal";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils/cn";
import type { BlogPost } from "@/types";

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function BlogFeedPage() {
  const user = useUserStore((s) => s.user);
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 400);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isPending,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
  } = useBlogFeed(debouncedKeyword);

  const allPosts = data?.pages.flatMap((p) => p.content) ?? [];

  // Intersection observer for infinite scroll
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchNextPage();
    }, { rootMargin: "200px" });
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasNextPage, fetchNextPage]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* ── Hero header ────────────────────────────────────────────────── */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-5 text-white shadow-lg sm:p-6">
        <div className="relative z-10">
          <h1 className="text-xl font-extrabold sm:text-2xl">Bảng tin cộng đồng</h1>
          <p className="mt-1 text-sm text-white/70">Chia sẻ kiến thức, câu chuyện và những điều thú vị</p>
          {user && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 dark:bg-gray-800 dark:text-indigo-200 dark:hover:bg-indigo-900/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Viết bài mới
            </button>
          )}
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 right-1/4 h-24 w-24 rounded-full bg-white/5" />
      </div>

      {/* ── Create post quick bar (if logged in) ───────────────────────── */}
      {user && (
        <div
          onClick={() => setCreateOpen(true)}
          className="mb-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-3.5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-sm font-bold text-white">
            {user.full_name.split(" ").map((p) => p[0]).slice(-2).join("").toUpperCase()}
          </div>
          <span className="flex-1 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-400 px-4 py-2.5 text-sm text-gray-400 hover:bg-white dark:hover:bg-gray-600">
            {user.full_name.split(" ").pop()} ơi, bạn đang nghĩ gì vậy? ✍️
          </span>
        </div>
      )}

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="relative mb-5">
        <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm kiếm bài viết..."
          className="w-full rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-700"
        />
        {keyword && (
          <button
            type="button"
            onClick={() => setKeyword("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* ── Feed ───────────────────────────────────────────────────────── */}
      {isPending ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 p-5 shadow-sm">
              <div className="flex gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-gray-200" />
                  <div className="h-2.5 w-1/4 rounded bg-gray-200" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 w-2/3 rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="h-3 w-5/6 rounded bg-gray-200" />
              </div>
              <div className={cn("mt-4 h-36 rounded-xl bg-gray-200", i === 2 && "hidden")} />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
          <p className="font-medium text-red-600">Không thể tải bài viết.</p>
        </div>
      ) : allPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 py-20 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 h-12 w-12 text-gray-300">
            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <p className="text-base font-semibold text-gray-600 dark:text-gray-400">
            {debouncedKeyword ? `Không tìm thấy bài viết nào cho "${debouncedKeyword}"` : "Chưa có bài viết nào"}
          </p>
          {!debouncedKeyword && user && (
            <button onClick={() => setCreateOpen(true)} className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              Viết bài đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {allPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              onOpenDetail={(p) => setSelectedPost(p)}
            />
          ))}
        </div>
      )}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            Đang tải thêm...
          </div>
        )}
        {!hasNextPage && allPosts.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">Đã hiển thị tất cả {allPosts.length} bài viết</p>
        )}
      </div>

      {/* Create post modal */}
      <PostFormModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Post detail modal */}
      {selectedPost && (
        <BlogPostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
