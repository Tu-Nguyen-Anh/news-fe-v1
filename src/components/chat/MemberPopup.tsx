import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";
import type { ChatGroupMember } from "@/types";

interface MemberPopupProps {
  member: ChatGroupMember;
  anchorRect: DOMRect; // position of the trigger element
  onClose: () => void;
  onDm?: (userId: number) => void;
  isMe?: boolean;
}

export function MemberPopup({ member, anchorRect, onClose, onDm, isMe }: MemberPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    const timeout = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  // Calculate position: try right of anchor, flip left if near edge
  const winW = window.innerWidth;
  const popupW = 220;
  let left = anchorRect.right + 8;
  if (left + popupW > winW - 8) left = anchorRect.left - popupW - 8;
  const top = Math.min(anchorRect.top, window.innerHeight - 200);

  const colors = [
    "from-violet-400 to-violet-600",
    "from-blue-400 to-blue-600",
    "from-emerald-400 to-emerald-600",
    "from-orange-400 to-orange-600",
    "from-pink-400 to-pink-600",
    "from-teal-400 to-teal-600",
  ];
  const gradient = colors[member.user_id % colors.length];

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-[220px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-150"
      style={{ top, left }}
    >
      {/* Banner */}
      <div className={cn("h-16 bg-gradient-to-br", gradient)} />

      {/* Avatar */}
      <div className="relative flex justify-center -mt-8 mb-3">
        {member.avatar ? (
          <img
            src={member.avatar}
            alt={member.full_name}
            className="w-16 h-16 rounded-full object-cover border-4 border-white shadow"
          />
        ) : (
          <div className={cn("w-16 h-16 rounded-full border-4 border-white shadow bg-gradient-to-br flex items-center justify-center text-white text-xl font-bold", gradient)}>
            {member.full_name[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pb-4 text-center">
        <p className="font-semibold text-gray-900 text-sm leading-tight">{member.full_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">@{member.username}</p>
        <div className="mt-2 flex justify-center">
          <span
            className={cn(
              "text-xs font-medium px-2.5 py-0.5 rounded-full",
              member.role === "ADMIN"
                ? "bg-primary-50 text-primary-700 border border-primary-200"
                : "bg-gray-100 text-gray-500",
            )}
          >
            {member.role === "ADMIN" ? "Quản trị viên" : "Thành viên"}
          </span>
        </div>
        {!isMe && onDm && (
          <button
            onClick={() => { onDm(member.user_id); onClose(); }}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Nhắn tin
          </button>
        )}
      </div>
    </div>
  );
}
