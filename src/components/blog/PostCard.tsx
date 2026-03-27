import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useDeletePost, useLikePost } from "@/hooks/useBlog";
import { PostFormModal } from "./PostFormModal";
import { ShareModal } from "./ShareModal";
import { cn } from "@/utils/cn";
import { AdminBadge, isAdmin } from "@/utils/adminBadge";
import type { BlogPost } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(ts: number) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60_000);
  const h = Math.floor(d / 3_600_000);
  const day = Math.floor(d / 86_400_000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  if (h < 24) return `${h} giờ trước`;
  if (day < 7) return `${day} ngày trước`;
  return new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const AVATAR_GRADIENTS = [
  "from-indigo-400 to-violet-500",
  "from-rose-400 to-pink-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-fuchsia-400 to-purple-500",
];

function avatarGradient(userId: number) {
  return AVATAR_GRADIENTS[userId % AVATAR_GRADIENTS.length];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: BlogPost;
  currentUserId?: number;
  /** Called after delete so parent can refetch/remove */
  onDeleted?: (postId: number) => void;
  /** If true renders compact card (for profile grid) */
  compact?: boolean;
  /** If provided, uses this as an additional hint for author admin state */
  authorIsAdmin?: boolean;
  /** If "horizontal" renders wide card: image left + content right */
  layout?: "vertical" | "horizontal";
  /** Open post in a modal overlay instead of navigating */
  onOpenDetail?: (post: BlogPost) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PostCard({
  post,
  currentUserId,
  onDeleted,
  compact = false,
  authorIsAdmin,
  layout = "vertical",
  onOpenDetail,
}: PostCardProps) {
  const navigate = useNavigate();
  const isOwn = currentUserId === post.user_id;
  // Some endpoints may omit `author_username`. Allow parent page to provide a hint.
  const showAdminBadge = isAdmin(post.author_username) || isAdmin(post.author_name) || authorIsAdmin;

  // Optimistic like state
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [likeAnim, setLikeAnim] = useState(false);
  useEffect(() => { setLiked(post.liked); setLikeCount(post.like_count); }, [post.liked, post.like_count]);

  const likeMutation = useLikePost();
  const deletePost = useDeletePost();

  // UI state
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

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

  async function handleDelete() {
    await deletePost.mutateAsync(post.id);
    setConfirmDelete(false);
    onDeleted?.(post.id);
  }

  const goToDetail = () => {
    if (onOpenDetail) {
      onOpenDetail(post);
    } else {
      navigate({ to: "/blog/post/$postId", params: { postId: String(post.id) } });
    }
  };
  const goToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: "/blog/profile/$userId", params: { userId: String(post.user_id) } });
  };

  const CONTENT_LIMIT = compact ? 120 : 280;
  const isLong = post.content.length > CONTENT_LIMIT;
  const displayContent = isLong && !expanded ? post.content.slice(0, CONTENT_LIMIT) + "…" : post.content;

  if (compact) {
    return (
      <>
        <div
          onClick={goToDetail}
          className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
        >
          {post.image_url && (
            <div className="aspect-video overflow-hidden bg-gray-100">
              <img src={post.image_url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
            </div>
          )}
          <div className="p-4">
            <p className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{post.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">{post.content}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className={cn("h-3.5 w-3.5", liked ? "text-red-500" : "")}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {likeCount}
              </span>
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {post.comment_count}
              </span>
              <span className="ml-auto">{relativeTime(post.created_at)}</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (layout === "horizontal") {
    return (
      <article className="flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md flex-col sm:flex-row">
        <div className="relative w-full sm:w-72 sm:shrink-0">
          {post.image_url ? (
            <button type="button" onClick={goToDetail} className="block h-full w-full">
              <img
                src={post.image_url}
                alt=""
                className="h-56 w-full object-cover sm:h-full sm:w-72"
                onError={(e) => ((e.target as HTMLImageElement).parentElement!.style.display = "none")}
              />
            </button>
          ) : (
            <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-fuchsia-50 to-rose-50 sm:h-full">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm ring-1 ring-gray-100">
                <svg className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h10M7 16h10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-3 px-4 pt-5 sm:px-6">
            <button type="button" onClick={goToProfile} className="flex items-start gap-3 text-left">
              {post.author_avatar ? (
                <img src={post.author_avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white", avatarGradient(post.user_id))}>
                  {getInitials(post.author_name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-base font-bold text-gray-900 transition-colors leading-tight">
                  {post.author_name ?? "Người dùng"}
                  {showAdminBadge && <AdminBadge size="lg" />}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                  <span>{relativeTime(post.created_at)}</span>
                  <span>·</span>
                  {post.visibility === 0 ? <span title="Công khai">🌐</span> : <span title="Riêng tư" className="text-gray-300">🔒</span>}
                </div>
              </div>
            </button>

            {/* 3-dot menu (own posts) */}
            {isOwn && (
              <div ref={menuRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setEditOpen(true);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmDelete(true);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xóa bài
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Body ───────────────────────────────────────────────────────── */}
          <div className="flex min-w-0 flex-1 flex-col px-4 pb-3 pt-2 sm:px-5">
            <h3
              onClick={goToDetail}
              className="cursor-pointer text-base font-bold text-gray-900 hover:text-indigo-700 transition-colors"
            >
              {post.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {displayContent}
              {isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="ml-1 text-indigo-600 hover:underline font-medium"
                >
                  {expanded ? " Thu gọn" : " Xem thêm"}
                </button>
              )}
            </p>

            {/* ── Stats bar ─────────────────────────────────────────────── */}
            <div className="mt-auto flex items-center gap-1 border-t border-gray-100 pt-3 pb-2 text-xs text-gray-400">
              {likeCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-red-500">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {likeCount.toLocaleString("vi-VN")}
                </span>
              )}
              <span className="flex-1" />
              {post.comment_count > 0 && (
                <button onClick={goToDetail} className="hover:text-gray-600">
                  {post.comment_count} bình luận
                </button>
              )}
              {post.share_count > 0 && <span className="ml-2">{post.share_count} chia sẻ</span>}
            </div>

            {/* ── Action buttons ───────────────────────────────────────── */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
              <button
                type="button"
                onClick={handleLike}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                  liked ? "text-red-500 bg-red-50/60 hover:bg-red-50" : "text-gray-500 hover:bg-gray-50",
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
                Thích
              </button>
              <button
                type="button"
                onClick={goToDetail}
                className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Bình luận
              </button>
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Chia sẻ
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <PostFormModal open={editOpen} onClose={() => setEditOpen(false)} editPost={post} />
        <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} post={post} />

        {/* Delete confirm */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mt-3 text-base font-semibold text-gray-900">Xóa bài viết?</h3>
              <p className="mt-1 text-sm text-gray-500">Hành động này không thể hoàn tác.</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Hủy
                </button>
                <button onClick={handleDelete} disabled={deletePost.isPending} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  {deletePost.isPending ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        )}
      </article>
    );
  }

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
          <button type="button" onClick={goToProfile} className="flex items-start gap-3 text-left">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white", avatarGradient(post.user_id))}>
                {getInitials(post.author_name)}
              </div>
            )}
            <div>
              <p className="flex items-center gap-1 text-base font-bold text-gray-900 hover:text-indigo-600 transition-colors leading-tight">
                {post.author_name ?? "Người dùng"}
                {showAdminBadge && <AdminBadge size="lg" />}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span>{relativeTime(post.created_at)}</span>
                <span>·</span>
                {post.visibility === 0 ? (
                  <span title="Công khai">🌐</span>
                ) : (
                  <span title="Riêng tư" className="text-gray-300">🔒</span>
                )}
              </div>
            </div>
          </button>

          {/* 3-dot menu (own posts) */}
          {isOwn && (
            <div ref={menuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Xóa bài
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="px-4 pb-3 sm:px-5">
          <h3
            onClick={goToDetail}
            className="cursor-pointer text-base font-bold text-gray-900 hover:text-indigo-700 transition-colors"
          >
            {post.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
            {displayContent}
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="ml-1 text-indigo-600 hover:underline font-medium"
              >
                {expanded ? " Thu gọn" : " Xem thêm"}
              </button>
            )}
          </p>
        </div>

        {/* ── Cover image ────────────────────────────────────────────────── */}
        {post.image_url && (
          <div className="mx-4 mb-3 overflow-hidden rounded-xl bg-gray-100">
            <img
              src={post.image_url}
              alt=""
              onClick={goToDetail}
              className="max-h-80 w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
              onError={(e) => ((e.target as HTMLImageElement).parentElement!.style.display = "none")}
            />
          </div>
        )}

        {/* ── Stats bar ──────────────────────────────────────────────────── */}
        <div className="mx-4 flex items-center gap-1 border-t border-gray-100 py-2.5 text-xs text-gray-400 sm:mx-5">
          {likeCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-red-500">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {likeCount.toLocaleString("vi-VN")}
            </span>
          )}
          <span className="flex-1" />
          {post.comment_count > 0 && (
            <button onClick={goToDetail} className="hover:text-gray-600">{post.comment_count} bình luận</button>
          )}
          {post.share_count > 0 && (
            <span className="ml-2">{post.share_count} chia sẻ</span>
          )}
        </div>

        {/* ── Action buttons ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
          <button
            type="button"
            onClick={handleLike}
            className={cn(
              "flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              liked ? "text-red-500 bg-red-50/60 hover:bg-red-50" : "text-gray-500 hover:bg-gray-50",
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
            Thích
          </button>

          <button
            type="button"
            onClick={goToDetail}
            className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Bình luận
          </button>

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
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

      {/* Modals */}
      <PostFormModal open={editOpen} onClose={() => setEditOpen(false)} editPost={post} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} post={post} />

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-gray-900">Xóa bài viết?</h3>
            <p className="mt-1 text-sm text-gray-500">Hành động này không thể hoàn tác.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
              <button onClick={handleDelete} disabled={deletePost.isPending} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {deletePost.isPending ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
