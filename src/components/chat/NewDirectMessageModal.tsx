import { useEffect, useRef, useState } from "react";
import { useOpenDirectMessage } from "@/hooks/useChatGroups";
import { userService } from "@/services/userService";
import type { ChatGroup, MentionUser } from "@/types";

interface NewDirectMessageModalProps {
  currentUserId: number;
  onOpen: (group: ChatGroup) => void;
  onClose: () => void;
}

export function NewDirectMessageModal({ currentUserId, onOpen, onClose }: NewDirectMessageModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MentionUser[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const openDm = useOpenDirectMessage();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const page = await userService.mentionSearch(q, 0, 10);
      setResults(page.content.filter((u) => u.id !== currentUserId));
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (user: MentionUser) => {
    openDm.mutate(user.id, {
      onSuccess: (group) => {
        onOpen(group);
        onClose();
      },
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/4 z-50 w-[min(400px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Tin nhắn mới</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => void handleSearch(e.target.value)}
              placeholder="Tìm tên hoặc username..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {searching && (
            <div className="flex items-center justify-center py-8 text-sm text-gray-400">Đang tìm kiếm...</div>
          )}

          {!searching && query && results.length === 0 && (
            <div className="flex items-center justify-center py-8 text-sm text-gray-400">Không tìm thấy người dùng</div>
          )}

          {!searching && !query && (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
              <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
              </svg>
              <p className="text-sm">Nhập tên để tìm kiếm</p>
            </div>
          )}

          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              disabled={openDm.isPending}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.full_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold shrink-0">
                  {user.full_name[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                <p className="text-xs text-gray-400">@{user.username}</p>
              </div>
              <span className="text-xs text-primary-600 font-medium shrink-0">
                {openDm.isPending ? "..." : "Nhắn tin"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
