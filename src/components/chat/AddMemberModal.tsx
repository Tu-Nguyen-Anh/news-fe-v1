import { useState } from "react";
import { useAddMember, useGroupDetail } from "@/hooks/useChatGroups";
import { userService } from "@/services/userService";
import { cn } from "@/utils/cn";
import type { User } from "@/types";

interface AddMemberModalProps {
  groupId: number;
  currentUserId: number;
  onClose: () => void;
}

export function AddMemberModal({ groupId, currentUserId, onClose }: AddMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const { data: detail } = useGroupDetail(groupId);
  const addMember = useAddMember(groupId);

  const existingUserIds = new Set((detail?.members ?? []).map((m) => m.user_id));

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const page = await userService.filter({ keyword: q, page: 0, size: 10 });
      setSearchResults(
        page.content.filter((u) => u.id !== currentUserId && !existingUserIds.has(u.id)),
      );
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = (user: User) => {
    addMember.mutate(
      { user_id: user.id },
      {
        onSuccess: () => {
          setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Thêm thành viên</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => void handleSearch(e.target.value)}
              placeholder="Tìm theo tên, username..."
              autoFocus
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>

          {searching && (
            <div className="text-center text-sm text-gray-400">Đang tìm kiếm...</div>
          )}

          {/* Results */}
          {searchResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto -mx-2 space-y-0.5">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.full_name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm shrink-0">
                      {user.full_name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                    <p className="text-xs text-gray-400">@{user.username}</p>
                  </div>
                  <button
                    onClick={() => handleAdd(user)}
                    disabled={addMember.isPending}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50",
                      "bg-primary-500 text-white hover:bg-primary-600",
                    )}
                  >
                    Thêm
                  </button>
                </div>
              ))}
            </div>
          )}

          {!searching && searchQuery && searchResults.length === 0 && (
            <p className="text-center text-sm text-gray-400">Không tìm thấy người dùng</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
