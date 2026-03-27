import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useAddBlogComment,
  useBlogComments,
  useBlogReplies,
  useDeleteBlogComment,
} from "@/hooks/useBlog";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils/cn";
import { AdminBadge, isAdmin } from "@/utils/adminBadge";
import type { BlogComment } from "@/types";

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
  return new Date(ts).toLocaleDateString("vi-VN");
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const GRADIENTS = ["from-indigo-400 to-violet-500","from-rose-400 to-pink-500","from-emerald-400 to-teal-500","from-amber-400 to-orange-500","from-sky-400 to-blue-500"];
function gradient(id: number) { return GRADIENTS[id % GRADIENTS.length]; }

// ─── Comment Input ─────────────────────────────────────────────────────────────

function CommentInput({
  postId,
  parentCommentId,
  placeholder = "Viết bình luận...",
  onDone,
}: {
  postId: number;
  parentCommentId?: number;
  placeholder?: string;
  onDone?: () => void;
}) {
  const [text, setText] = useState("");
  const user = useUserStore((s) => s.user);
  const addComment = useAddBlogComment(postId);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    await addComment.mutateAsync({ content: trimmed, parent_comment_id: parentCommentId ?? null });
    setText("");
    onDone?.();
  }

  if (!user) return (
    <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500 text-center border border-dashed border-gray-200">
      Đăng nhập để bình luận
    </p>
  );

  return (
    <div className="flex gap-3">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white", gradient(user.id))}>
        {user.avatar ? <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" /> : getInitials(user.full_name)}
      </div>
      <div className="flex flex-1 items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 transition-all focus-within:border-indigo-300 focus-within:bg-white focus-within:shadow-sm">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder={placeholder}
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          style={{ minHeight: "32px", maxHeight: "120px" }}
        />
        <button
          type="button"
          onClick={() => submit()}
          disabled={!text.trim() || addComment.isPending}
          className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Reply Thread ──────────────────────────────────────────────────────────────

function ReplyThread({ postId, comment, currentUserId }: {
  postId: number;
  comment: BlogComment;
  currentUserId?: number;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const { data: replyData, isPending: repliesLoading } = useBlogReplies(postId, comment.id, showReplies);
  const deleteComment = useDeleteBlogComment(postId);

  async function handleDelete(commentId: number) {
    setDeletingId(commentId);
    try { await deleteComment.mutateAsync(commentId); } finally { setDeletingId(null); }
  }

  return (
    <li className="flex gap-2 sm:gap-3">
      {/* Author avatar */}
      <button type="button" onClick={() => navigate({ to: "/blog/profile/$userId", params: { userId: String(comment.user_id) } })} className="shrink-0 pt-0.5">
        {comment.author_avatar ? (
          <img src={comment.author_avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white", gradient(comment.user_id))}>
            {getInitials(comment.author_name)}
          </div>
        )}
      </button>

      <div className="flex-1 min-w-0">
        {/* Comment bubble */}
        <div className="w-full rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2.5">
          <button
            type="button"
            onClick={() => navigate({ to: "/blog/profile/$userId", params: { userId: String(comment.user_id) } })}
            className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-indigo-600"
          >
            {comment.author_name ?? "Người dùng"}
            {(isAdmin(comment.author_username) || isAdmin(comment.author_name)) && <AdminBadge />}
          </button>
          <p className="mt-0.5 text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>
        </div>

        {/* Meta row */}
        <div className="mt-1 flex w-full items-center gap-3 text-xs text-gray-400">
          <button type="button" onClick={() => setReplying((r) => !r)} className="font-semibold text-gray-600 hover:text-indigo-600">
            Phản hồi
          </button>
          {currentUserId === comment.user_id && (
            <button
              type="button"
              onClick={() => handleDelete(comment.id)}
              disabled={deletingId === comment.id}
              className="text-red-400 hover:text-red-600 disabled:opacity-50"
            >
              {deletingId === comment.id ? "Đang xóa..." : "Xóa"}
            </button>
          )}
          <span className="ml-auto min-w-[92px] overflow-hidden text-ellipsis whitespace-nowrap tabular-nums">
            {relativeTime(comment.created_at)}
          </span>
        </div>

        {/* Reply input */}
        {replying && (
          <div className="mt-2">
            <CommentInput
              postId={postId}
              parentCommentId={comment.id}
              placeholder={`Phản hồi ${comment.author_name ?? ""}...`}
              onDone={() => { setReplying(false); setShowReplies(true); }}
            />
          </div>
        )}

        {/* Show/hide replies toggle:
            - always show before first click (!showReplies)
            - show while loading (repliesLoading)
            - show when there are replies (replyData.amount > 0)
            - hide when loaded and zero replies */}
        {(!showReplies || repliesLoading || (replyData?.amount ?? 0) > 0) && (
          <button
            type="button"
            onClick={() => setShowReplies((s) => !s)}
            className="mt-1.5 flex items-center gap-1.5 pl-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("h-3.5 w-3.5 transition-transform", showReplies && !repliesLoading && "rotate-90")}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {repliesLoading
              ? "Đang tải..."
              : showReplies
                ? "Ẩn phản hồi"
                : replyData?.amount
                  ? `${replyData.amount} phản hồi`
                  : "Xem phản hồi"}
          </button>
        )}

        {/* Replies list */}
        {showReplies && replyData?.content.length ? (
          <ul className="mt-2 space-y-3 border-l-2 border-indigo-100 pl-4">
            {replyData.content.map((reply) => (
              <li key={reply.id} className="flex gap-2">
                <button type="button" onClick={() => navigate({ to: "/blog/profile/$userId", params: { userId: String(reply.user_id) } })} className="shrink-0 pt-0.5">
                  {reply.author_avatar ? (
                    <img src={reply.author_avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white", gradient(reply.user_id))}>
                      {getInitials(reply.author_name)}
                    </div>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="w-full rounded-2xl rounded-tl-sm bg-indigo-50 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/blog/profile/$userId", params: { userId: String(reply.user_id) } })}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-900 hover:text-indigo-600"
                    >
                      {reply.author_name ?? "Người dùng"}
                      {(isAdmin(reply.author_username) || isAdmin(reply.author_name)) && <AdminBadge />}
                    </button>
                    <p className="mt-0.5 text-sm text-gray-800 whitespace-pre-wrap">{reply.content}</p>
                  </div>
                  <div className="mt-1 flex w-full items-center gap-3 text-xs text-gray-400">
                    {currentUserId === reply.user_id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(reply.id)}
                        disabled={deletingId === reply.id}
                        className="text-red-400 hover:text-red-600"
                      >
                        {deletingId === reply.id ? "Đang xóa..." : "Xóa"}
                      </button>
                    )}
                    <span className="ml-auto min-w-[92px] overflow-hidden text-ellipsis whitespace-nowrap tabular-nums">
                      {relativeTime(reply.created_at)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface BlogPostCommentsProps {
  postId: number;
  currentUserId?: number;
}

export function BlogPostComments({ postId, currentUserId }: BlogPostCommentsProps) {
  const [page, setPage] = useState(0);
  const { data, isPending } = useBlogComments(postId, page);
  const totalPages = data ? Math.ceil(data.amount / 10) : 0;

  return (
    <section>
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-indigo-600">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-900">Bình luận</h2>
        {data && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{data.amount}</span>}
      </div>

      <CommentInput postId={postId} />

      <div className="mt-5">
        {isPending ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-16 rounded-2xl bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.content.length ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 h-8 w-8 text-gray-300">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">Chưa có bình luận</p>
            <p className="mt-0.5 text-xs text-gray-400">Hãy là người đầu tiên!</p>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {data.content.map((comment) => (
                <ReplyThread key={comment.id} postId={postId} comment={comment} currentUserId={currentUserId} />
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-center gap-2">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 0} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40">← Trước</button>
                <span className="text-xs text-gray-500">{page + 1}/{totalPages}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40">Tiếp →</button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
