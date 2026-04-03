import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useBlogUserProfile } from "@/hooks/useBlog";
import { PostCard } from "@/components/blog/PostCard";
import { BlogPostDetailModal } from "@/components/blog/BlogPostDetailModal";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils/cn";
import { AdminBadge, isAdmin } from "@/utils/adminBadge";
import type { BlogPost } from "@/types";

const COVER_GRADIENTS = [
  "from-indigo-600 via-violet-600 to-purple-700",
  "from-rose-500 via-pink-600 to-fuchsia-700",
  "from-emerald-500 via-teal-600 to-cyan-700",
  "from-amber-500 via-orange-600 to-red-600",
  "from-sky-500 via-blue-600 to-indigo-700",
];
function coverGradient(id: number) { return COVER_GRADIENTS[id % COVER_GRADIENTS.length]; }

const AVATAR_GRADIENTS = ["from-indigo-400 to-violet-500","from-rose-400 to-pink-500","from-emerald-400 to-teal-500","from-amber-400 to-orange-500","from-sky-400 to-blue-500"];
function avatarGradient(id: number) { return AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length]; }

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function BlogUserProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams({ strict: false }) as { userId: string };
  const uid = parseInt(userId, 10);
  const currentUser = useUserStore((s) => s.user);
  const isOwn = currentUser?.id === uid;

  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const { data: profile, isPending, isError } = useBlogUserProfile(uid);


  if (isPending) return (
    <div className="mx-auto max-w-5xl animate-pulse">
      <div className="h-44 w-full rounded-3xl bg-gray-200" />
      <div className="mx-6 -mt-12 flex items-end gap-4">
        <div className="h-28 w-28 rounded-3xl bg-gray-300" />
        <div className="mb-2 flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-gray-200" />
          <div className="h-3 w-1/4 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );

  if (isError || !profile) return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-red-100 bg-red-50 p-10 text-center">
      <p className="font-semibold text-red-600">Không tìm thấy hồ sơ người dùng.</p>
      <button onClick={() => navigate({ to: "/blog" })} className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm text-white">Quay lại</button>
    </div>
  );

  const posts = profile.posts.content;

  return (
    <div className="mx-auto w-full max-w-5xl px-2 sm:px-0">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate({ to: "/blog" })}
        className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-700 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Quay lại bảng tin
      </button>

      {/* Profile header */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
        {/* Cover */}
        <div className={cn("relative h-44 w-full bg-gradient-to-r", coverGradient(uid))}>
          <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNi02aDZ2LTZoLTZ2NnptLTEyIDBoNnYtNmgtNnY2em0tMTIgMGg2di02aC02djZ6TTI0IDM0aDZ2LTZoLTZ2NnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        </div>

        {/* Avatar + Info */}
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="absolute -top-14 left-6">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt=""
                className="h-28 w-28 rounded-3xl border-4 border-white dark:border-gray-800 object-cover shadow-xl"
              />
            ) : (
              <div
                className={cn(
                  "flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-white dark:border-gray-800 bg-gradient-to-br text-3xl font-extrabold text-white shadow-xl",
                  avatarGradient(uid),
                )}
              >
                {getInitials(profile.full_name)}
              </div>
            )}
          </div>

          {/* Stats + name */}
          <div className="pt-14">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-[16rem]">
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{profile.full_name}</h1>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">@{profile.username}</p>
                  {isAdmin(profile.username) && <AdminBadge size="lg" />}
                  {isOwn && (
                    <span className="rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
                      Trang của bạn
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-indigo-50 to-white dark:border-gray-700 dark:from-indigo-900/30 dark:to-gray-800 px-5 py-3 text-center shadow-sm">
                  <p className="text-2xl font-extrabold text-indigo-700">{profile.total_posts}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bài viết</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="mt-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1 w-6 rounded-full bg-gradient-to-r from-indigo-600 to-rose-600" />
          <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
            {isOwn ? "Bài viết của bạn" : `Bài viết của ${profile.full_name}`}
          </h2>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 py-16 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 h-12 w-12 text-gray-300">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {isOwn ? "Bạn chưa có bài viết nào" : "Người dùng này chưa đăng bài"}
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-5xl space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUser?.id}
                authorIsAdmin={isAdmin(profile.username)}
                onOpenDetail={(p) => setSelectedPost(p)}
              />
            ))}
          </div>
        )}
      </div>
      {selectedPost && (
        <BlogPostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
