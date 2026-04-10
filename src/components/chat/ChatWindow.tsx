/**
 * ChatWindow — main message pane.
 *
 * Optimizations implemented:
 *  1. Virtual Scrolling    — @tanstack/react-virtual renders only visible messages.
 *  3. Scroll Position      — preserved when older messages are prepended.
 *  5. Skeleton Screen      — shown during initial load instead of a plain spinner.
 */
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MessageBubble } from "./MessageBubble";
import { MessageSkeleton } from "./MessageSkeleton";
import { MemberPopup } from "./MemberPopup";
import { EmojiPicker } from "./EmojiPicker";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useGroupDetail } from "@/hooks/useChatGroups";
import { chatService } from "@/services/chatService";
import { Spinner } from "@/components/ui";
import { cn } from "@/utils/cn";
import type { ChatGroup, ChatGroupMember, ReaderResponse } from "@/types";

interface ChatWindowProps {
  group: ChatGroup;
  currentUserId: number;
  onOpenInfo: () => void;
  onBack?: () => void;
  onOnlineUsersChange?: (users: Record<number, boolean>) => void;
  onDm?: (userId: number) => void;
}

// ── @mention hook ──────────────────────────────────────────────────────────────

function useMention(input: string, cursorPos: number, members: ChatGroupMember[]) {
  const textBefore = input.slice(0, cursorPos);
  const match = textBefore.match(/@(\w*)$/);
  const query = match ? match[1].toLowerCase() : null;

  const suggestions =
    query !== null
      ? members.filter(
          (m) =>
            m.username.toLowerCase().includes(query) ||
            m.full_name.toLowerCase().includes(query),
        )
      : [];

  const atStart = match ? cursorPos - match[0].length : 0;
  return { suggestions, query, atStart };
}

// ── ChatWindow ─────────────────────────────────────────────────────────────────

export function ChatWindow({
  group,
  currentUserId,
  onOpenInfo,
  onBack,
  onOnlineUsersChange,
  onDm,
}: ChatWindowProps) {
  const {
    messages,
    initialLoading,
    loadingMore,
    hasMore,
    loadMore,
    sendMessage,
    onlineUsers,
    addReaction,
    removeReaction,
    recallMessage,
  } = useChatMessages(group.id);

  const { data: groupDetail } = useGroupDetail(group.id);
  const members = groupDetail?.members ?? [];

  const dmOther = group.is_direct ? members.find((m) => m.user_id !== currentUserId) : null;
  const displayName = dmOther?.full_name ?? group.name ?? "Tin nhắn riêng";
  const displayAvatar = dmOther?.avatar ?? group.avatar;

  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [memberPopup, setMemberPopup] = useState<{ member: ChatGroupMember; rect: DOMRect } | null>(
    null,
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [readDetailPopup, setReadDetailPopup] = useState<{
    messageId: number;
    readers: ReaderResponse[];
  } | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputValueRef = useRef("");
  const isFirstLoad = useRef(true);
  const userScrolledUp = useRef(false);
  // ── Criteria 3: Scroll position refs ──────────────────────────────────────
  const isLoadingMoreRef = useRef(false);

  const { suggestions, query, atStart } = useMention(input, cursorPos, members);

  // ── Criteria 1: Virtual Scrolling ─────────────────────────────────────────
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 72,  // rough estimate; measureElement provides accurate heights
    overscan: 8,
  });

  // ── Scroll to bottom helper ────────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // ── Notify parent of online users ──────────────────────────────────────────
  useEffect(() => {
    onOnlineUsersChange?.(onlineUsers);
  }, [onlineUsers, onOnlineUsersChange]);

  // ── Online count for header ────────────────────────────────────────────────
  const onlineCount = useMemo(
    () => members.filter((m) => onlineUsers[m.user_id] === true).length,
    [members, onlineUsers],
  );

  // ── Read receipt computation (WhatsApp-style) ──────────────────────────────
  const lastReadMessageIdByUser = useMemo(() => {
    const map = new Map<number, number>();
    for (const msg of messages) {
      for (const reader of msg.readers ?? []) {
        if (reader.user_id === currentUserId) continue;
        const cur = map.get(reader.user_id) ?? 0;
        if (msg.id > cur) map.set(reader.user_id, msg.id);
      }
    }
    return map;
  }, [messages, currentUserId]);

  const getReadReceiptReaders = useCallback(
    (msgId: number): ReaderResponse[] => {
      const msg = messages.find((m) => m.id === msgId);
      if (!msg) return [];
      return (msg.readers ?? []).filter(
        (r) => r.user_id !== currentUserId && lastReadMessageIdByUser.get(r.user_id) === msgId,
      );
    },
    [messages, currentUserId, lastReadMessageIdByUser],
  );

  // ── Reset state when group changes ────────────────────────────────────────
  useEffect(() => {
    isFirstLoad.current = true;
    userScrolledUp.current = false;
    inputValueRef.current = "";
    setInput("");
    textareaRef.current?.focus();
  }, [group.id]);

  // ── Scroll to bottom on initial load ──────────────────────────────────────
  useEffect(() => {
    if (!initialLoading && messages.length > 0 && isFirstLoad.current) {
      isFirstLoad.current = false;
      requestAnimationFrame(() => scrollToBottom("instant" as ScrollBehavior));
    }
  }, [initialLoading, messages.length, scrollToBottom]);

  // ── Auto-scroll when new messages arrive (only if near bottom) ────────────
  const prevLengthRef = useRef(0);
  useEffect(() => {
    const newMsgArrived = messages.length > prevLengthRef.current;
    const wasAtBottom = !userScrolledUp.current && !isFirstLoad.current;
    if (newMsgArrived && wasAtBottom && !isLoadingMoreRef.current) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
    }
    prevLengthRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  // ── Criteria 3: Load older messages while preserving scroll position ───────
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;

    const el = scrollRef.current;
    const prevScrollHeight = el?.scrollHeight ?? 0;
    const prevScrollTop = el?.scrollTop ?? 0;

    await loadMore();

    // After messages are prepended, compensate for the height diff so the
    // currently-visible content stays in view.
    requestAnimationFrame(() => {
      if (el && el.scrollHeight !== prevScrollHeight) {
        el.scrollTop = prevScrollTop + (el.scrollHeight - prevScrollHeight);
      }
      isLoadingMoreRef.current = false;
    });
  }, [loadMore]);

  // ── Scroll event: track position + trigger load-more near top ────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUp.current = distFromBottom > 120;
    setShowScrollBtn(distFromBottom > 200);

    // Near top → load older messages (replaces IntersectionObserver sentinel)
    if (el.scrollTop < 80 && hasMore && !loadingMore && !isLoadingMoreRef.current) {
      void handleLoadMore();
    }
  }, [hasMore, loadingMore, handleLoadMore]);

  // ── Recall ────────────────────────────────────────────────────────────────
  const handleRecall = useCallback(
    async (messageId: number) => {
      await recallMessage(messageId);
    },
    [recallMessage],
  );

  // ── Read receipt detail ───────────────────────────────────────────────────
  const handleReadReceiptClick = useCallback(
    async (messageId: number) => {
      try {
        const readers = await chatService.getMessageReads(group.id, messageId);
        setReadDetailPopup({ messageId, readers });
      } catch {
        // ignore
      }
    },
    [group.id],
  );

  // ── Reaction handler ──────────────────────────────────────────────────────
  const handleReact = useCallback(
    (messageId: number, emoji: string, alreadyReacted: boolean) => {
      if (alreadyReacted) void removeReaction(messageId, emoji);
      else void addReaction(messageId, emoji);
    },
    [addReaction, removeReaction],
  );

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = () => {
    const trimmed = inputValueRef.current.trim();
    if (!trimmed) return;
    inputValueRef.current = "";
    setInput("");
    setCursorPos(0);
    sendMessage(trimmed);
    userScrolledUp.current = false;
    requestAnimationFrame(() => scrollToBottom("smooth"));
    textareaRef.current?.focus();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  // ── Emoji send ────────────────────────────────────────────────────────────
  const handleEmojiSend = (emoji: string) => {
    sendMessage(emoji, "EMOJI");
    setShowEmojiPicker(false);
    userScrolledUp.current = false;
    requestAnimationFrame(() => scrollToBottom("smooth"));
    textareaRef.current?.focus();
  };

  // ── Mention selection ─────────────────────────────────────────────────────
  const insertMention = (username: string) => {
    const before = input.slice(0, atStart);
    const after = input.slice(atStart + 1 + (query?.length ?? 0));
    const newVal = `${before}@${username} ${after}`;
    inputValueRef.current = newVal;
    setInput(newVal);
    setCursorPos(before.length + username.length + 2);
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = before.length + username.length + 2;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 128) + "px";
      }
    }, 0);
  };

  // ── Keyboard handlers ─────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestions[mentionIndex].username);
        setMentionIndex(0);
        return;
      }
      if (e.key === "Escape") {
        setCursorPos(0);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    inputValueRef.current = e.target.value;
    setInput(e.target.value);
    setCursorPos(e.target.selectionStart ?? 0);
    setMentionIndex(0);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
  };

  // ── Member avatar click ───────────────────────────────────────────────────
  const handleSenderClick = (senderId: number, rect: DOMRect) => {
    const member = members.find((m) => m.user_id === senderId);
    if (member) setMemberPopup({ member, rect });
  };

  // ── Virtual items ─────────────────────────────────────────────────────────
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="sm:hidden flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors -ml-1"
            aria-label="Quay lại"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <button
          onClick={onOpenInfo}
          className="flex flex-1 items-center gap-2.5 min-w-0 group text-left"
          title={group.is_direct ? "Xem thông tin" : "Xem thông tin nhóm"}
        >
          <div className="relative shrink-0">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={displayName}
                loading="lazy"
                className="w-9 h-9 rounded-full object-cover group-hover:ring-2 group-hover:ring-primary-300 transition-all"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm group-hover:ring-2 group-hover:ring-primary-300 transition-all">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            {onlineCount > 0 && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-white" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors leading-tight truncate">
                {displayName}
              </p>
              {group.is_direct && (
                <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-indigo-50 text-indigo-500 shrink-0">
                  DM
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
              {group.is_direct ? "Tin nhắn trực tiếp" : `${group.member_count} thành viên`}
              {onlineCount > 0 && (
                <span className="text-emerald-500 ml-1">• đang online</span>
              )}
            </p>
          </div>
        </button>

        <button
          onClick={onOpenInfo}
          title="Thông tin nhóm"
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>

      {/* ── Messages area ───────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0">
        {/* ── Criteria 5: Skeleton Screen on initial load ──────────────── */}
        {initialLoading && messages.length === 0 ? (
          <div className="absolute inset-0 overflow-y-auto">
            <MessageSkeleton />
          </div>
        ) : messages.length === 0 && !initialLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 select-none">
            <svg
              className="w-12 h-12 mb-2 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm">Chưa có tin nhắn. Hãy bắt đầu trò chuyện!</span>
          </div>
        ) : (
          <>
            {/* ── Criteria 1: Virtual Scrolling container ────────────── */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="absolute inset-0 overflow-y-auto"
            >
              {/* Load-more status (sticky overlay at top) */}
              <div className="sticky top-0 z-10 flex justify-center py-1.5 pointer-events-none">
                {loadingMore ? (
                  <div className="pointer-events-auto bg-white/90 dark:bg-gray-800/90 rounded-full px-3 py-1 shadow-sm border border-gray-100 dark:border-gray-700">
                    <Spinner />
                  </div>
                ) : !hasMore && messages.length > 0 ? (
                  <span className="bg-white/90 dark:bg-gray-800/90 rounded-full px-2.5 py-0.5 text-[11px] text-gray-300 dark:text-gray-600 shadow-sm border border-gray-100 dark:border-gray-700">
                    Đã tải hết tin nhắn
                  </span>
                ) : null}
              </div>

              {/* Virtual list wrapper — total height determines scrollHeight */}
              <div
                style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
              >
                {virtualItems.map((vItem) => {
                  const msg = messages[vItem.index];
                  const prev = messages[vItem.index - 1];
                  const showAvatar = !prev || prev.sender_id !== msg.sender_id;
                  const isMine = msg.sender_id === currentUserId;

                  return (
                    <div
                      key={vItem.key}
                      data-index={vItem.index}
                      ref={virtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${vItem.start}px)`,
                      }}
                      className="px-4 py-0.5"
                    >
                      <MessageBubble
                        message={msg}
                        isMine={isMine}
                        showAvatar={showAvatar}
                        onSenderClick={handleSenderClick}
                        readReceiptReaders={isMine ? getReadReceiptReaders(msg.id) : undefined}
                        onReact={handleReact}
                        onRecall={isMine && !msg.pending ? handleRecall : undefined}
                        onReadReceiptClick={isMine ? handleReadReceiptClick : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scroll to bottom button */}
            {showScrollBtn && (
              <button
                onClick={() => {
                  userScrolledUp.current = false;
                  scrollToBottom("smooth");
                }}
                className="absolute bottom-3 right-4 w-9 h-9 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-md flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        {/* @mention dropdown */}
        {suggestions.length > 0 && (
          <div className="mx-3 mb-1 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {suggestions.map((m, i) => (
              <button
                key={m.member_id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(m.username);
                  setMentionIndex(0);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                  i === mentionIndex
                    ? "bg-primary-50"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700",
                )}
              >
                <div className="relative shrink-0">
                  {m.avatar ? (
                    <img
                      src={m.avatar}
                      alt={m.full_name}
                      loading="lazy"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-200">
                      {m.full_name[0]?.toUpperCase()}
                    </div>
                  )}
                  {onlineUsers[m.user_id] && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-1 ring-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {m.full_name}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">
                    @{m.username}
                  </span>
                  {onlineUsers[m.user_id] && (
                    <span className="text-xs text-emerald-500 ml-1.5">● online</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="px-3 py-2.5 flex items-end gap-2">
          {/* Emoji picker */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Gửi emoji"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            {showEmojiPicker && (
              <EmojiPicker onSelect={handleEmojiSend} onClose={() => setShowEmojiPicker(false)} />
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSelect={(e) =>
              setCursorPos((e.target as HTMLTextAreaElement).selectionStart ?? 0)
            }
            placeholder="Nhập tin nhắn..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3.5 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:focus:ring-indigo-500/30 transition-all"
            style={{ lineHeight: "1.5", maxHeight: "128px", overflowY: "auto" }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center shrink-0 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Member popup */}
      {memberPopup && (
        <MemberPopup
          member={memberPopup.member}
          anchorRect={memberPopup.rect}
          onClose={() => setMemberPopup(null)}
          onDm={onDm}
          isMe={memberPopup.member.user_id === currentUserId}
        />
      )}

      {/* Read receipt detail popup */}
      {readDetailPopup && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setReadDetailPopup(null)} />
          <div className="fixed bottom-24 right-6 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 w-72 max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Đã đọc ({readDetailPopup.readers.length})
              </span>
              <button
                onClick={() => setReadDetailPopup(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {readDetailPopup.readers.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                Chưa ai đọc
              </p>
            ) : (
              <div className="space-y-2">
                {readDetailPopup.readers.map((r) => (
                  <div key={r.user_id} className="flex items-center gap-2.5">
                    {r.avatar ? (
                      <img
                        src={r.avatar}
                        alt={r.full_name}
                        loading="lazy"
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-200 shrink-0">
                        {r.full_name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {r.full_name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(r.read_at).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
