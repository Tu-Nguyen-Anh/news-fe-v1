import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useComments, useCreateComment, useDeleteComment } from "@/hooks/useComments";
import { userService } from "@/services/userService";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils/cn";
import type { Comment, CommentMentionedUser, MentionUser } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  if (h < 24) return `${h} giờ trước`;
  if (d < 7) return `${d} ngày trước`;
  return new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function renderContent(content: string, mentionedUsers: CommentMentionedUser[] | null) {
  if (!mentionedUsers?.length) return <span>{content}</span>;
  const mentionMap = new Map(mentionedUsers.map((u) => [u.username, u]));
  const parts = content.split(/(@\w+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@") && mentionMap.has(part.slice(1))) {
          return (
            <span
              key={i}
              className="inline-flex items-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold text-indigo-700"
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

const MAX_CHARS = 2000;
const COMMENT_PAGE_SIZE = 10;

// ─── Main Component ───────────────────────────────────────────────────────────

interface CommentSectionProps {
  articleId: number;
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const currentUser = useUserStore((s) => s.user);
  const [page, setPage] = useState(0);

  const { data, isPending, isError } = useComments(articleId, page, COMMENT_PAGE_SIZE);
  const createComment = useCreateComment(articleId);
  const deleteComment = useDeleteComment(articleId);

  const totalPages = data ? Math.ceil(data.amount / COMMENT_PAGE_SIZE) : 0;

  // ─── Input state ────────────────────────────────────────────────────────────
  const [content, setContent] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<number[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce mention query
  useEffect(() => {
    if (mentionQuery === null) return;
    const t = setTimeout(() => setDebouncedQuery(mentionQuery), 250);
    return () => clearTimeout(t);
  }, [mentionQuery]);

  // Mention search query
  const { data: mentionResults } = useQuery({
    queryKey: ["mention-search", debouncedQuery],
    queryFn: () => userService.mentionSearch(debouncedQuery, 0, 6),
    enabled: mentionQuery !== null,
    staleTime: 10_000,
  });

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [content]);

  // Close dropdown on outside click
  useEffect(() => {
    if (mentionQuery === null) return;
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node) && !textareaRef.current?.contains(e.target as Node)) {
        setMentionQuery(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mentionQuery]);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    if (val.length > MAX_CHARS) return;
    setContent(val);
    setError(null);

    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const match = before.match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);
  }

  function handleSelectMention(user: MentionUser) {
    const cursor = textareaRef.current?.selectionStart ?? content.length;
    const before = content.slice(0, cursor);
    const after = content.slice(cursor);
    const match = before.match(/@(\w*)$/);
    if (!match) return;
    const replaced = before.slice(0, before.length - match[0].length) + `@${user.username} `;
    setContent(replaced + after);
    setMentionedUserIds((prev) => (prev.includes(user.id) ? prev : [...prev, user.id]));
    setMentionQuery(null);
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = replaced.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return setError("Bình luận không được để trống.");
    try {
      await createComment.mutateAsync({
        content: trimmed,
        mentioned_user_ids: mentionedUserIds.length ? mentionedUserIds : undefined,
      });
      setContent("");
      setMentionedUserIds([]);
      setPage(0);
    } catch {
      setError("Không thể gửi bình luận. Vui lòng thử lại.");
    }
  }

  async function handleDelete(commentId: number) {
    setDeletingId(commentId);
    try {
      await deleteComment.mutateAsync(commentId);
    } finally {
      setDeletingId(null);
    }
  }

  const showSuggestions = mentionQuery !== null && (mentionResults?.content.length ?? 0) > 0;

  return (
    <section className="mt-6">
      {/* Section header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-indigo-600">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-900">Bình luận</h2>
        {data && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
            {data.amount}
          </span>
        )}
      </div>

      {/* Comment input */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-5">
          <div className="flex gap-3">
            {/* Avatar */}
            <div className="shrink-0 pt-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-bold text-white shadow-sm">
                {getInitials(currentUser.full_name)}
              </div>
            </div>
            {/* Input + dropdown wrapper */}
            <div className="relative min-w-0 flex-1">
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow focus-within:shadow-md",
                  error ? "border-red-300 focus-within:border-red-400" : "border-gray-200 focus-within:border-indigo-300",
                )}
              >
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleTextChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !showSuggestions) {
                      e.preventDefault();
                      handleSubmit(e as unknown as React.FormEvent);
                    }
                    if (e.key === "Escape") setMentionQuery(null);
                  }}
                  placeholder="Viết bình luận... Gõ @ để tag người dùng"
                  rows={1}
                  className="w-full resize-none bg-transparent px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                  style={{ minHeight: "44px", maxHeight: "160px" }}
                />

                {/* Bottom row: char count + submit */}
                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-3 py-2">
                  <span className={cn("text-xs", content.length > MAX_CHARS * 0.9 ? "text-amber-500" : "text-gray-400")}>
                    {content.length}/{MAX_CHARS}
                  </span>
                  <button
                    type="submit"
                    disabled={createComment.isPending || !content.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createComment.isPending ? (
                      <span className="animate-pulse">Đang gửi...</span>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        Gửi
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* @mention dropdown */}
              {showSuggestions && (
                <ul
                  ref={dropdownRef}
                  className="absolute bottom-full left-0 z-40 mb-1.5 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
                >
                  {mentionResults!.content.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectMention(user);
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-indigo-50"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-300 to-violet-400 text-xs font-bold text-white">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            getInitials(user.full_name)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">@{user.username}</p>
                          <p className="truncate text-xs text-gray-500">{user.full_name}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Hint */}
              <p className="mt-1.5 text-[11px] text-gray-400">
                Nhấn <kbd className="rounded bg-gray-100 px-1 font-mono text-[10px]">Enter</kbd> để gửi,{" "}
                <kbd className="rounded bg-gray-100 px-1 font-mono text-[10px]">Shift+Enter</kbd> xuống dòng
              </p>
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </form>
      ) : (
        <div className="mb-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
          Đăng nhập để bình luận
        </div>
      )}

      {/* Comments list */}
      {isPending ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse gap-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-gray-200" />
                <div className="h-3 w-2/3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          Không thể tải bình luận.
        </div>
      ) : !data?.content.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-8 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 h-8 w-8 text-gray-300">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">Chưa có bình luận nào</p>
          <p className="mt-0.5 text-xs text-gray-400">Hãy là người đầu tiên bình luận!</p>
        </div>
      ) : (
        <ul className="space-y-0.5">
          {data.content.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUser?.id}
              isDeleting={deletingId === comment.id}
              onDelete={() => handleDelete(comment.id)}
            />
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            ← Trước
          </button>
          <span className="text-xs text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Tiếp →
          </button>
        </div>
      )}
    </section>
  );
}

// ─── Comment Item ──────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  currentUserId,
  isDeleting,
  onDelete,
}: {
  comment: Comment;
  currentUserId?: number;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const isOwn = currentUserId === comment.user_id;

  return (
    <li className="group flex gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-gray-50">
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {comment.avatar ? (
          <img src={comment.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-xs font-bold text-white">
            {getInitials(comment.full_name)}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-[1fr_auto] items-start gap-x-2">
          <div className="min-w-0 flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-gray-900">{comment.full_name}</span>
            <span className="text-xs text-gray-400">@{comment.username}</span>
          </div>
          <span className="text-right text-xs text-gray-400 tabular-nums whitespace-nowrap">
            {formatRelativeTime(comment.created_at)}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-gray-700">
          {renderContent(comment.content, comment.mentioned_users)}
        </p>
      </div>

      {/* Delete button placeholder (keeps right-side alignment even when not shown). */}
      <button
        type="button"
        onClick={() => {
          if (!isOwn) return;
          onDelete();
        }}
        disabled={!isOwn || isDeleting}
        className="mt-0.5 h-8 w-8 shrink-0 self-start rounded-lg p-1.5 text-gray-300 transition-all hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed"
        aria-hidden={!isOwn}
        style={{ visibility: isOwn ? "visible" : "hidden" }}
        title={isOwn ? "Xóa bình luận" : undefined}
      >
        {isDeleting && isOwn ? (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M12 2a10 10 0 1 0 10 10" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        )}
      </button>
    </li>
  );
}
