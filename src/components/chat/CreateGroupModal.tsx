import { useState } from "react";
import { useCreateGroup } from "@/hooks/useChatGroups";
import { userService } from "@/services/userService";
import { cn } from "@/utils/cn";
import type { User } from "@/types";

interface CreateGroupModalProps {
  currentUserId: number;
  onClose: () => void;
  onCreated: (groupId: number) => void;
}

export function CreateGroupModal({ currentUserId, onClose, onCreated }: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const createGroup = useCreateGroup();

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const page = await userService.filter({ keyword: q, page: 0, size: 10 });
      setSearchResults(page.content.filter((u) => u.id !== currentUserId));
    } finally {
      setSearching(false);
    }
  };

  const toggleUser = (user: User) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  };

  const handleCreate = () => {
    if (!name.trim() || selectedUsers.length === 0) return;
    createGroup.mutate(
      { name: name.trim(), member_ids: selectedUsers.map((u) => u.id) },
      { onSuccess: (group) => onCreated(group.id) },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Tạo nhóm chat mới</h2>
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
          {/* Group name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Tên nhóm <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên nhóm..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>

          {/* Search users */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Thêm thành viên <span className="text-red-400">*</span>
            </label>
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
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-gray-100 rounded-lg">
                {searchResults.map((user) => {
                  const selected = selectedUsers.some((u) => u.id === user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors",
                        selected && "bg-primary-50",
                      )}
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.full_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-xs shrink-0">
                          {user.full_name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      </div>
                      {selected && (
                        <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {searching && (
              <div className="mt-2 text-center text-sm text-gray-400">Đang tìm kiếm...</div>
            )}
          </div>

          {/* Selected chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedUsers.map((user) => (
                <span
                  key={user.id}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs rounded-full border border-primary-200"
                >
                  {user.full_name}
                  <button
                    onClick={() => toggleUser(user)}
                    className="text-primary-400 hover:text-primary-700 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selectedUsers.length === 0 || createGroup.isPending}
            className="px-5 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {createGroup.isPending ? "Đang tạo..." : "Tạo nhóm"}
          </button>
        </div>
      </div>
    </div>
  );
}
