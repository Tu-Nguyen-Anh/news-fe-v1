import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLikePost } from "@/hooks/useBlog";
import { BlogPostComments } from "./BlogPostComments";
import { PostFormModal } from "./PostFormModal";
import { ShareModal } from "./ShareModal";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils/cn";
import { AdminBadge, isAdmin } from "@/utils/adminBadge";
import type { BlogPost } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  "from-indigo-400 to-violet-500",
  "from-rose-400 to-pink-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
];
function avatarGradient(userId: number) { return AVATAR_GRADIENTS[userId % AVATAR_GRADIENTS.length]; }
function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BlogPostDetailModalProps {
  post: BlogPost;
  onClose: () => void;
}

export function BlogPostDetailModal({ post, onClose }: BlogPostDetailModalProps) {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const likeMutation = useLikePost();

  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [likeAnim, setLikeAnim] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setLiked(post.liked);
    setLikeCount(post.like_count);
  }, [post.liked, post.like_count]);

  // Escape key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function handleLike() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => wasLiked ? c - 1 : c + 1);
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    try {
      await likeMutation.mutateAsync({ id: post.id, liked: wasLiked });
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => wasLiked ? c + 1 : c - 1);
    }
  }

  const isOwn = user?.id === post.user_id;
  const showAdminBadge = isAdmin(post.author_username) || isAdmin(post.author_name);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Sheet */}
        <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-gray-800 sm:rounded-2xl">
          {/* Drag handle (mobile) */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Bài viết</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto overscroll-contain">
            <article>
              {/* Author header */}
              <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate({ to: "/blog/profile/$userId", params: { userId: String(post.user_id) } });
                  }}
                  className="flex items-center gap-3 text-left"
                >
                  {post.author_avatar ? (
                    <img src={post.author_avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover sm:h-11 sm:w-11" />
                  ) : (
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white sm:h-11 sm:w-11", avatarGradient(post.user_id))}>
                      {getInitials(post.author_name)}
                    </div>
                  )}
                  <div>
                    <p className="flex items-center gap-1 text-base font-bold text-gray-900 hover:text-indigo-600 dark:text-gray-100 sm:text-lg">
                      {post.author_name ?? "Người dùng"}
                      {showAdminBadge && <AdminBadge />}
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-1">
                      {formatDate(post.created_at)} · {post.visibility === 0 ? "🌐 Công khai" : "🔒 Riêng tư"}
                    </p>
                  </div>
                </button>
                {isOwn && (
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Sửa
                  </button>
                )}
              </div>

              {/* Title + Content */}
              <div className="px-4 pb-3 sm:px-5">
                <h1 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 sm:text-2xl">{post.title}</h1>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200 sm:text-base">{post.content}</p>
              </div>

              {/* Cover image */}
              {post.image_url && (
                <div className="mx-4 mb-3 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
                  <img
                    src={post.image_url}
                    alt=""
                    className="max-h-64 w-full object-cover sm:max-h-96"
                    onError={(e) => ((e.target as HTMLImageElement).parentElement!.style.display = "none")}
                  />
                </div>
              )}

              {/* Stats */}
              <div className="mx-4 flex items-center gap-3 border-t border-gray-100 py-2.5 text-xs text-gray-400 sm:mx-5 dark:border-gray-700 dark:text-gray-500">
                {likeCount > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-red-500">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {likeCount.toLocaleString("vi-VN")}
                  </span>
                )}
                <span className="flex-1" />
                {post.comment_count > 0 && <span>{post.comment_count} bình luận</span>}
                {post.share_count > 0 && <span>{post.share_count} chia sẻ</span>}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleLike}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                    liked
                      ? "bg-red-50/60 text-red-500 hover:bg-red-50 dark:bg-red-900/30 dark:hover:bg-red-900/40"
                      : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700",
                  )}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill={liked ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn("h-5 w-5 transition-transform", likeAnim && "scale-125")}
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {liked ? "Đã thích" : "Thích"}
                </button>
                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Chia sẻ
                </button>
              </div>
            </article>

            {/* Comments section */}
            <div className="border-t border-gray-100 px-4 py-5 sm:px-5 dark:border-gray-700">
              <BlogPostComments postId={post.id} currentUserId={user?.id} />
            </div>
          </div>
        </div>
      </div>

      <PostFormModal open={editOpen} onClose={() => setEditOpen(false)} editPost={post} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} post={post} />
    </>
  );
}
