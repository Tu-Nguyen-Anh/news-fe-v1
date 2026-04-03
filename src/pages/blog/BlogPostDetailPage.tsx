import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useBlogComments, useBlogPost, useLikePost } from "@/hooks/useBlog";
import { BlogPostComments } from "@/components/blog/BlogPostComments";
import { PostFormModal } from "@/components/blog/PostFormModal";
import { ShareModal } from "@/components/blog/ShareModal";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils/cn";
import { AdminBadge, isAdmin } from "@/utils/adminBadge";

const AVATAR_GRADIENTS = ["from-indigo-400 to-violet-500","from-rose-400 to-pink-500","from-emerald-400 to-teal-500","from-amber-400 to-orange-500","from-sky-400 to-blue-500"];
function avatarGradient(userId: number) { return AVATAR_GRADIENTS[userId % AVATAR_GRADIENTS.length]; }
function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export default function BlogPostDetailPage() {
  const navigate = useNavigate();
  const { postId } = useParams({ strict: false }) as { postId: string };
  const id = parseInt(postId, 10);
  const user = useUserStore((s) => s.user);

  const { data: post, isPending, isError } = useBlogPost(id);
  const { isPending: commentsPending } = useBlogComments(id);
  const likeMutation = useLikePost();


  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeAnim, setLikeAnim] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (post) { setLiked(post.liked); setLikeCount(post.like_count); }
  }, [post]);

  async function handleLike() {
    if (!post) return;
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

  if (isPending || commentsPending) return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-4">
      <div className="h-8 w-1/2 rounded-xl bg-gray-200" />
      <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 p-6 shadow-sm space-y-3">
        <div className="flex gap-3"><div className="h-10 w-10 rounded-full bg-gray-200" /><div className="flex-1 space-y-2"><div className="h-3 w-1/3 rounded bg-gray-200" /><div className="h-2.5 w-1/4 rounded bg-gray-200" /></div></div>
        <div className="h-6 w-3/4 rounded bg-gray-200" />
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-3 rounded bg-gray-200" />)}</div>
      </div>
    </div>
  );

  if (isError || !post) return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
      <p className="font-semibold text-red-600">Không tìm thấy bài viết.</p>
      <button onClick={() => navigate({ to: "/blog" })} className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600">Quay lại bảng tin</button>
    </div>
  );

  const isOwn = user?.id === post.user_id;
  const showAdminBadge = isAdmin(post.author_username) || isAdmin(post.author_name);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate({ to: "/blog" })}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Quay lại bảng tin
      </button>

      {/* Post card */}
      <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4">
          <button
            type="button"
            onClick={() => navigate({ to: "/blog/profile/$userId", params: { userId: String(post.user_id) } })}
            className="flex items-center gap-3"
          >
            {post.author_avatar ? (
              <img src={post.author_avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white", avatarGradient(post.user_id))}>
                {getInitials(post.author_name)}
              </div>
            )}
            <div className="text-left">
              <p className="flex items-center gap-1 text-base font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600">
                {post.author_name ?? "Người dùng"}
                {showAdminBadge && <AdminBadge />}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(post.created_at)} · {post.visibility === 0 ? "🌐 Công khai" : "🔒 Riêng tư"}</p>
            </div>
          </button>
          {isOwn && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Chỉnh sửa
            </button>
          )}
        </div>

        {/* Title + Content */}
        <div className="px-6 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{post.title}</h1>
          <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-gray-800 dark:text-gray-200">{post.content}</p>
        </div>

        {/* Cover image */}
        {post.image_url && (
          <div className="mx-4 mb-4 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-700">
            <img src={post.image_url} alt="" className="max-h-96 w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).parentElement!.style.display = "none")} />
          </div>
        )}

        {/* Stats */}
        <div className="mx-6 flex items-center gap-3 border-t border-gray-100 dark:border-gray-700 py-3 text-xs text-gray-400 dark:text-gray-500">
          {likeCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-red-500">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
              {likeCount.toLocaleString("vi-VN")}
            </span>
          )}
          <span className="flex-1" />
          {post.comment_count > 0 && <span>{post.comment_count} bình luận</span>}
          {post.share_count > 0 && <span>{post.share_count} chia sẻ</span>}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={handleLike}
            className={cn("flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              liked ? "text-red-500 bg-red-50/60 dark:bg-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/30" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700")}
          >
            <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={cn("h-5 w-5 transition-transform", likeAnim && "scale-125")}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {liked ? "Đã thích" : "Thích"}
          </button>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Chia sẻ
          </button>
        </div>
      </article>

      {/* Comments */}
      <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 p-6 shadow-sm">
        <BlogPostComments postId={post.id} currentUserId={user?.id} />
      </div>

      <PostFormModal open={editOpen} onClose={() => setEditOpen(false)} editPost={post} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} post={post} />
    </div>
  );
}
