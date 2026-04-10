import { useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { ReactionPicker } from "./ReactionPicker";
import type { ChatMessage, ReaderResponse } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  showAvatar: boolean;
  onSenderClick?: (senderId: number, rect: DOMRect) => void;
  /** Readers to show as tiny avatars under this own-message (pre-filtered by caller). */
  readReceiptReaders?: ReaderResponse[];
  /** Called when user picks or toggles an emoji. `alreadyReacted` = whether to remove. */
  onReact: (messageId: number, emoji: string, alreadyReacted: boolean) => void;
  onRecall?: (messageId: number) => void;
  onReadReceiptClick?: (messageId: number) => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  return isToday
    ? d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) +
        " " +
        d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function renderContent(content: string, mine: boolean) {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) =>
    /^@\w+$/.test(part) ? (
      <span key={i} className={mine ? "font-semibold text-primary-200" : "font-semibold text-primary-600"}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

const avatarColors = [
  "bg-violet-400", "bg-blue-400", "bg-emerald-400",
  "bg-orange-400", "bg-pink-400", "bg-teal-400",
];

function MiniAvatar({ avatar, fullName, userId, title }: { avatar: string | null; fullName: string; userId: number; title?: string }) {
  const color = avatarColors[userId % avatarColors.length];
  return (
    <div
      title={title ?? fullName}
      className="w-[18px] h-[18px] rounded-full ring-1 ring-white overflow-hidden shrink-0"
    >
      {avatar ? (
        <img src={avatar} alt={fullName} className="w-full h-full object-cover" />
      ) : (
        <div className={cn("w-full h-full flex items-center justify-center text-[8px] font-bold text-white", color)}>
          {fullName[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function MessageBubble({
  message,
  isMine,
  showAvatar,
  onSenderClick,
  readReceiptReaders,
  onReact,
  onRecall,
  onReadReceiptClick,
}: MessageBubbleProps) {
  const avatarRef = useRef<HTMLButtonElement>(null);
  const [showPicker, setShowPicker] = useState(false);

  const handleAvatarClick = () => {
    const rect = avatarRef.current?.getBoundingClientRect();
    if (rect) onSenderClick?.(message.sender_id, rect);
  };

  const color = avatarColors[message.sender_id % avatarColors.length];
  const reactions = message.reactions ?? [];
  const hasReactions = reactions.length > 0;
  const hasReadReceipts = isMine && !!readReceiptReaders?.length;

  return (
    <div className={cn("flex items-end gap-2 group/msg", isMine ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar (others only) */}
      <div className="w-8 shrink-0">
        {!isMine && showAvatar && (
          <button
            ref={avatarRef}
            onClick={handleAvatarClick}
            className="focus:outline-none"
            title={message.sender_full_name}
          >
            {message.sender_avatar ? (
              <img
                src={message.sender_avatar}
                alt={message.sender_full_name}
                loading="lazy"
                decoding="async"
                className="w-8 h-8 rounded-full object-cover hover:ring-2 hover:ring-primary-300 transition-all"
              />
            ) : (
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold hover:ring-2 hover:ring-primary-300 transition-all",
                  color,
                )}
              >
                {message.sender_full_name
                  .split(" ")
                  .slice(-2)
                  .map((w) => w[0]?.toUpperCase())
                  .join("") || "U"}
              </div>
            )}
          </button>
        )}
      </div>

      {/* Content column */}
      <div className={cn("flex flex-col", isMine ? "items-end" : "items-start", "max-w-[68%]")}>
        {/* Sender name */}
        {!isMine && showAvatar && (
          <button
            onClick={handleAvatarClick}
            className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1 hover:text-primary-600 transition-colors focus:outline-none"
          >
            {message.sender_full_name}
          </button>
        )}

        {/* Bubble + emoji trigger (wrapper for positioning) */}
        <div className="relative flex items-center gap-1.5">
          {/* Recall button — left of emoji trigger for own messages */}
          {isMine && !message.recalled && onRecall && (
            <button
              onClick={() => { if (confirm("Thu hồi tin nhắn này?")) onRecall(message.id); }}
              className="opacity-0 group-hover/msg:opacity-100 transition-opacity w-6 h-6 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 shrink-0"
              title="Thu hồi tin nhắn"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
          )}

          {/* Emoji trigger — left of bubble for own messages, right for others */}
          {isMine && (
            <button
              onClick={() => setShowPicker((p) => !p)}
              className="opacity-0 group-hover/msg:opacity-100 transition-opacity w-6 h-6 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 shrink-0"
              title="Thả cảm xúc"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          {/* Bubble itself */}
          <div className="relative">
            {/* Reaction picker popup */}
            {showPicker && (
              <ReactionPicker
                isMine={isMine}
                onSelect={(emoji) => {
                  const existing = reactions.find((r) => r.emoji === emoji);
                  onReact(message.id, emoji, existing?.reacted_by_me ?? false);
                  setShowPicker(false);
                }}
                onClose={() => setShowPicker(false)}
              />
            )}

            <div
              className={cn(
                "px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap",
                message.recalled
                  ? "bg-gray-50 border border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500"
                  : isMine
                    ? "bg-primary-500 text-white rounded-br-sm shadow-sm"
                    : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
              )}
            >
              {message.recalled ? (
                <span className="text-sm italic text-gray-400 select-none">Tin nhắn đã bị thu hồi</span>
              ) : message.message_type === "EMOJI" ? (
                <span className="text-4xl leading-none select-none">{message.content}</span>
              ) : message.message_type === "IMAGE" ? (
                /* Criteria 5: Lazy-loaded image with skeleton placeholder */
                <img
                  src={message.content}
                  alt="Ảnh"
                  loading="lazy"
                  decoding="async"
                  className="max-w-[240px] max-h-[320px] rounded-xl object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                renderContent(message.content, isMine)
              )}
            </div>
          </div>

          {/* Emoji trigger for others' messages */}
          {!isMine && (
            <button
              onClick={() => setShowPicker((p) => !p)}
              className="opacity-0 group-hover/msg:opacity-100 transition-opacity w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 shrink-0 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-600"
              title="Thả cảm xúc"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Reactions row */}
        {hasReactions && (
          <div className={cn("flex flex-wrap gap-1 mt-1", isMine ? "justify-end mr-1" : "justify-start ml-1")}>
            {reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact(message.id, r.emoji, r.reacted_by_me)}
                title={r.reactors.map((u) => u.full_name).join(", ")}
                className={cn(
                  "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs border transition-colors select-none",
                  r.reacted_by_me
                    ? "bg-primary-50 border-primary-300 text-primary-700 hover:bg-primary-100"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600",
                )}
              >
                <span className="text-sm leading-none">{r.emoji}</span>
                <span className="font-medium">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Criteria 2: Sending indicator for optimistic messages */}
        {message.pending ? (
          <span className={cn("text-[11px] mt-0.5 select-none text-gray-300 dark:text-gray-600 italic", isMine ? "mr-1" : "ml-1")}>
            Đang gửi…
          </span>
        ) : (
          /* Time (hover) */
          <span
            className={cn(
              "text-[11px] mt-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity select-none",
              isMine ? "text-gray-400 mr-1" : "text-gray-400 ml-1",
            )}
          >
            {formatTime(message.created_at)}
          </span>
        )}

        {/* Read receipt avatars (own messages, shown at bottom-right) */}
        {hasReadReceipts && (
          <button
            onClick={() => onReadReceiptClick?.(message.id)}
            title="Xem danh sách đã đọc"
            className={cn("flex items-center gap-0.5 mt-0.5", isMine ? "mr-1" : "ml-1")}
          >
            {readReceiptReaders!.slice(0, 5).map((r) => (
              <MiniAvatar
                key={r.user_id}
                avatar={r.avatar}
                fullName={r.full_name}
                userId={r.user_id}
                title={`${r.full_name} đã đọc`}
              />
            ))}
            {readReceiptReaders!.length > 5 && (
              <span className="text-[10px] text-gray-400 ml-0.5">+{readReceiptReaders!.length - 5}</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
