import { useState } from "react";
import { useSourcesWithFollowTopics } from "@/hooks/useSources";
import { useFollowTopic, useUnfollowTopic } from "@/hooks/useTopics";
import { SafeImage } from "@/components/ui/SafeImage";
import type { TopicWithFollowed } from "@/types";

function FollowToggle({
  topic,
  sourceId,
}: {
  topic: TopicWithFollowed;
  sourceId: number;
}) {
  const follow = useFollowTopic();
  const unfollow = useUnfollowTopic();
  const isPending = follow.isPending || unfollow.isPending;

  const handle = () => {
    if (isPending) return;
    if (topic.followed) {
      unfollow.mutate(topic.id);
    } else {
      follow.mutate(topic.id);
    }
  };

  // suppress unused warning
  void sourceId;

  return (
    <button
      type="button"
      onClick={handle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all disabled:opacity-60 ${
        topic.followed
          ? "border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-600 hover:border-indigo-600"
          : "border-gray-300 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
      }`}
      aria-pressed={topic.followed}
      title={topic.followed ? "Bỏ theo dõi" : "Theo dõi"}
    >
      {topic.followed ? (
        <>
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Đang theo dõi
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Theo dõi
        </>
      )}
    </button>
  );
}

function SourceCard({ source }: { source: ReturnType<typeof useSourcesWithFollowTopics>["data"] extends Array<infer T> | undefined ? T : never }) {
  const [open, setOpen] = useState(true);
  const followedCount = source.topics.filter((t) => t.followed).length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Source header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
          {source.avatar ? (
            <SafeImage src={source.avatar} alt={source.name} className="h-10 w-10 object-cover" />
          ) : (
            <span className="text-base font-bold text-gray-400">{source.name[0]?.toUpperCase()}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{source.name}</span>
            {followedCount > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                {followedCount}/{source.topics.length} theo dõi
              </span>
            )}
          </div>
          {source.description && (
            <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">{source.description}</p>
          )}
        </div>

        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Topics */}
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {source.topics.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400">Không có chủ đề nào.</p>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {source.topics.map((topic) => (
                <li
                  key={topic.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{topic.name}</div>
                    {topic.description && (
                      <div className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">{topic.description}</div>
                    )}
                  </div>
                  <FollowToggle topic={topic} sourceId={source.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function FollowTopicPage() {
  const { data: sources, isPending, isError, refetch } = useSourcesWithFollowTopics();
  const [search, setSearch] = useState("");

  const filteredSources = (sources ?? [])
    .map((s) => ({
      ...s,
      topics: search.trim()
        ? s.topics.filter(
            (t) =>
              t.name.toLowerCase().includes(search.toLowerCase()) ||
              (t.description ?? "").toLowerCase().includes(search.toLowerCase()),
          )
        : s.topics,
    }))
    .filter((s) => !search.trim() || s.topics.length > 0 || s.name.toLowerCase().includes(search.toLowerCase()));

  const totalFollowed = (sources ?? []).reduce(
    (sum, s) => sum + s.topics.filter((t) => t.followed).length,
    0,
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-[1px]">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5 dark:bg-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Theo dõi chủ đề</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Chọn các chủ đề bạn muốn theo dõi để lọc bài viết phù hợp
            </p>
          </div>
          {totalFollowed > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 dark:border-indigo-900/40 dark:bg-indigo-900/20">
              <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                Đang theo dõi {totalFollowed} chủ đề
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Tìm kiếm chủ đề..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 shadow-sm transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-indigo-500"
        />
      </div>

      {/* Content */}
      {isPending ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 py-12 dark:border-red-900/20 dark:bg-red-900/10">
          <p className="text-sm text-red-600 dark:text-red-400">Không thể tải danh sách nguồn tin.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg border border-red-200 bg-white px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:hover:bg-red-900/20"
          >
            Thử lại
          </button>
        </div>
      ) : filteredSources.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">Không tìm thấy chủ đề nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      )}
    </div>
  );
}
