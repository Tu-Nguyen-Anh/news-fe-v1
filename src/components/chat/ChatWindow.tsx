import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MessageBubble } from "./MessageBubble";
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
  onBack?: () => void; // mobile: back to group list
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

export function ChatWindow({ group, currentUserId, onOpenInfo, onBack, onOnlineUsersChange, onDm }: ChatWindowProps) {
  const { messages, initialLoading, loadingMore, hasMore, loadMore, sendMessage, onlineUsers, addReaction, removeReaction, recallMessage } =
    useChatMessages(group.id);
  const { data: groupDetail } = useGroupDetail(group.id);
  const members = groupDetail?.members ?? [];

  // DM: find the other participant for display
  const dmOther = group.is_direct ? members.find((m) => m.user_id !== currentUserId) : null;
  const displayName = dmOther?.full_name ?? group.name ?? "Tin nhắn riêng";
  const displayAvatar = dmOther?.avatar ?? group.avatar;

  const [input, setInput] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [memberPopup, setMemberPopup] = useState<{ member: ChatGroupMember; rect: DOMRect } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [readDetailPopup, setReadDetailPopup] = useState<{ messageId: number; readers: ReaderResponse[] } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isFirstLoad = useRef(true);
  const userScrolledUp = useRef(false);
  const savedScrollHeight = useRef(0);
  const inputValueRef = useRef(""); // synchronous mirror of input state

  const { suggestions, query, atStart } = useMention(input, cursorPos, members);

  // ── Notify parent when onlineUsers changes ────────────────────────────
  useEffect(() => {
    onOnlineUsersChange?.(onlineUsers);
  }, [onlineUsers, onOnlineUsersChange]);

  // ── Online count for header ────────────────────────────────────────────
  const onlineCount = useMemo(
    () => members.filter((m) => onlineUsers[m.user_id] === true).length,
    [members, onlineUsers],
  );

  // ── Read receipt computation ───────────────────────────────────────────
  // For each reader, find the highest-ID message they've read.
  // Show that reader's avatar only under that message (WhatsApp-style).
  const lastReadMessageIdByUser = useMemo(() => {
    const map = new Map<number, number>(); // userId → max message id they've read
    for (const msg of messages) {
      for (const reader of msg.readers ?? []) {
        if (reader.user_id === currentUserId) continue; // skip self
        const current = map.get(reader.user_id) ?? 0;
        if (msg.id > current) map.set(reader.user_id, msg.id);
      }
    }
    return map;
  }, [messages, currentUserId]);

  /** Returns readers to show under `msgId` (own messages only). */
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

  // ── Recall handler ─────────────────────────────────────────────────────
  const handleRecall = useCallback(
    async (messageId: number) => {
      await recallMessage(messageId);
    },
    [recallMessage],
  );

  // ── Read receipt click handler ─────────────────────────────────────────
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

  // ── Reaction handler ───────────────────────────────────────────────────
  const handleReact = useCallback(
    (messageId: number, emoji: string, alreadyReacted: boolean) => {
      if (alreadyReacted) {
        void removeReaction(messageId, emoji);
      } else {
        void addReaction(messageId, emoji);
      }
    },
    [addReaction, removeReaction],
  );

  // ── Auto-focus textarea when group changes ─────────────────────────────
  useEffect(() => {
    isFirstLoad.current = true;
    userScrolledUp.current = false;
    inputValueRef.current = "";
    setInput("");
    textareaRef.current?.focus();
  }, [group.id]);

  // ── Scroll to bottom on initial load ──────────────────────────────────
  useEffect(() => {
    if (!initialLoading && messages.length > 0 && isFirstLoad.current) {
      isFirstLoad.current = false;
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
      });
    }
  }, [initialLoading, messages.length]);

  // ── Auto-scroll when new messages arrive (only if not scrolled up) ────
  const prevLength = useRef(0);
  useEffect(() => {
    if (messages.length > prevLength.current && !userScrolledUp.current && !isFirstLoad.current) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
    prevLength.current = messages.length;
  }, [messages.length]);

  // ── Track if user scrolled up ──────────────────────────────────────────
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    userScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > 120;
  };

  // ── IntersectionObserver: load older when sentinel visible ─────────────
  const handleLoadMore = useCallback(async () => {
    const el = scrollRef.current;
    if (el) savedScrollHeight.current = el.scrollHeight;
    await loadMore();
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - savedScrollHeight.current;
    });
  }, [loadMore]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          void handleLoadMore();
        }
      },
      { root: scrollRef.current, threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, handleLoadMore]);

  // ── Scroll to bottom button ────────────────────────────────────────────
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    };
    el.addEventListener("scroll", check, { passive: true });
    return () => el.removeEventListener("scroll", check);
  }, []);

  // ── Send message ───────────────────────────────────────────────────────
  const handleSend = () => {
    const trimmed = inputValueRef.current.trim();
    if (!trimmed) return;
    // Clear synchronously before sending to prevent duplicate sends on rapid press
    inputValueRef.current = "";
    setInput("");
    setCursorPos(0);
    sendMessage(trimmed);
    userScrolledUp.current = false;
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    textareaRef.current?.focus();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  // ── Emoji send ─────────────────────────────────────────────────────────
  const handleEmojiSend = (emoji: string) => {
    sendMessage(emoji, "EMOJI");
    setShowEmojiPicker(false);
    userScrolledUp.current = false;
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    textareaRef.current?.focus();
  };

  // ── Mention selection ──────────────────────────────────────────────────
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

  // ── Keyboard handlers ──────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((i) => (i + 1) % suggestions.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex((i) => (i - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(suggestions[mentionIndex].username); setMentionIndex(0); return; }
      if (e.key === "Escape") { setCursorPos(0); return; }
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    inputValueRef.current = e.target.value;
    setInput(e.target.value);
    setCursorPos(e.target.selectionStart ?? 0);
    setMentionIndex(0);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
  };

  // ── Member avatar click ────────────────────────────────────────────────
  const handleSenderClick = (senderId: number, rect: DOMRect) => {
    const member = members.find((m) => m.user_id === senderId);
    if (member) setMemberPopup({ member, rect });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-white shrink-0">
        {/* Back button: mobile only */}
        {onBack && (
          <button
            onClick={onBack}
            className="sm:hidden flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors -ml-1"
            aria-label="Quay lại"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Group info button (avatar + name) */}
        <button
          onClick={onOpenInfo}
          className="flex flex-1 items-center gap-2.5 min-w-0 group text-left"
          title={group.is_direct ? "Xem thông tin" : "Xem thông tin nhóm"}
        >
          {/* Avatar with online indicator */}
          <div className="relative shrink-0">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover group-hover:ring-2 group-hover:ring-primary-300 transition-all"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm group-hover:ring-2 group-hover:ring-primary-300 transition-all">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            {/* Online indicator dot when at least 1 member is online */}
            {onlineCount > 0 && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-white" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors leading-tight truncate">
                {displayName}
              </p>
              {group.is_direct && (
                <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-indigo-50 text-indigo-500 shrink-0">DM</span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-tight">
              {group.is_direct ? "Tin nhắn trực tiếp" : `${group.member_count} thành viên`}
              {onlineCount > 0 && (
                <span className="text-emerald-500 ml-1">• đang online</span>
              )}
            </p>
          </div>
        </button>

        {/* Info icon */}
        <button
          onClick={onOpenInfo}
          title="Thông tin nhóm"
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto px-4 py-3 space-y-1"
        >
          {/* Top sentinel for infinite scroll */}
          <div ref={topSentinelRef} className="h-1" />

          {loadingMore && (
            <div className="flex justify-center py-2"><Spinner /></div>
          )}

          {!hasMore && !initialLoading && messages.length > 0 && (
            <p className="text-center text-xs text-gray-300 py-2">Đã tải hết tin nhắn</p>
          )}

          {initialLoading ? (
            <div className="flex justify-center items-center h-32"><Spinner /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 select-none">
              <svg className="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">Chưa có tin nhắn. Hãy bắt đầu trò chuyện!</span>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const prev = messages[idx - 1];
              const showAvatar = !prev || prev.sender_id !== msg.sender_id;
              const isMine = msg.sender_id === currentUserId;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={isMine}
                  showAvatar={showAvatar}
                  onSenderClick={handleSenderClick}
                  readReceiptReaders={isMine ? getReadReceiptReaders(msg.id) : undefined}
                  onReact={handleReact}
                  onRecall={isMine ? handleRecall : undefined}
                  onReadReceiptClick={isMine ? handleReadReceiptClick : undefined}
                />
              );
            })
          )}
          <div ref={bottomRef} className="h-1" />
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={() => { userScrolledUp.current = false; bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className="absolute bottom-3 right-4 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-t border-gray-100">
        {/* @mention dropdown */}
        {suggestions.length > 0 && (
          <div className="mx-3 mb-1 border border-gray-100 rounded-xl bg-white shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {suggestions.map((m, i) => (
              <button
                key={m.member_id}
                onMouseDown={(e) => { e.preventDefault(); insertMention(m.username); setMentionIndex(0); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                  i === mentionIndex ? "bg-primary-50" : "hover:bg-gray-50",
                )}
              >
                {/* Online dot on mention suggestion */}
                <div className="relative shrink-0">
                  {m.avatar
                    ? <img src={m.avatar} alt={m.full_name} className="w-7 h-7 rounded-full object-cover" />
                    : <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">{m.full_name[0]?.toUpperCase()}</div>
                  }
                  {onlineUsers[m.user_id] && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-1 ring-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-900">{m.full_name}</span>
                  <span className="text-xs text-gray-400 ml-1.5">@{m.username}</span>
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
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Gửi emoji"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSend}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSelect={(e) => setCursorPos((e.target as HTMLTextAreaElement).selectionStart ?? 0)}
            placeholder="Nhập tin nhắn..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
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

      {/* Member popup from avatar click */}
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
          <div className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-72 max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">Đã đọc ({readDetailPopup.readers.length})</span>
              <button onClick={() => setReadDetailPopup(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {readDetailPopup.readers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Chưa ai đọc</p>
            ) : (
              <div className="space-y-2">
                {readDetailPopup.readers.map((r) => (
                  <div key={r.user_id} className="flex items-center gap-2.5">
                    {r.avatar
                      ? <img src={r.avatar} alt={r.full_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">{r.full_name[0]?.toUpperCase()}</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.full_name}</p>
                      <p className="text-xs text-gray-400">{new Date(r.read_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</p>
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
