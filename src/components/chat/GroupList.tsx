import { useState } from "react";
import { cn } from "@/utils/cn";
import { useChatStore } from "@/store/chatStore";
import { useMyGroups, useGroupDetail } from "@/hooks/useChatGroups";
import type { ChatGroup } from "@/types";
import { Spinner } from "@/components/ui";

interface GroupListProps {
  selectedGroupId: number | null;
  currentUserId: number;
  onSelect: (group: ChatGroup) => void;
  onCreateGroup: () => void;
  onNewDm: () => void;
}

// ── Avatar component ───────────────────────────────────────────────────────────

const COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
];

function GroupAvatar({ group, dmAvatar, dmName }: { group: ChatGroup; dmAvatar?: string | null; dmName?: string }) {
  const src = group.is_direct ? dmAvatar : group.avatar;
  const label = group.is_direct ? (dmName ?? "DM") : (group.name ?? "G");
  const color = COLORS[group.id % COLORS.length];

  if (src) {
    return <img src={src} alt={label} className="h-11 w-11 rounded-full object-cover shrink-0" />;
  }

  if (group.is_direct) {
    const initials = label
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    return (
      <div className={cn("h-11 w-11 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0", color)}>
        {initials || "DM"}
      </div>
    );
  }

  const initials = (group.name ?? "G")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className={cn("h-11 w-11 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0", color)}>
      {initials || "G"}
    </div>
  );
}

// ── DM item: fetches group detail to resolve other member's name ───────────────

function DmGroupItem({
  group,
  currentUserId,
  isActive,
  unread,
  onSelect,
}: {
  group: ChatGroup;
  currentUserId: number;
  isActive: boolean;
  unread: number;
  onSelect: () => void;
}) {
  const { data: detail } = useGroupDetail(group.id);
  const other = detail?.members.find((m) => m.user_id !== currentUserId);
  const displayName = other?.full_name ?? "Tin nhắn riêng";
  const displayAvatar = other?.avatar;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
        isActive ? "bg-primary-50 border-r-2 border-primary-500" : "hover:bg-gray-50",
      )}
    >
      <GroupAvatar group={group} dmAvatar={displayAvatar} dmName={displayName} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className={cn("text-sm font-medium truncate", isActive ? "text-primary-700" : "text-gray-900")}>
              {displayName}
            </span>
            <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-indigo-50 text-indigo-500 shrink-0">DM</span>
          </div>
          {unread > 0 && (
            <span className="ml-1 min-w-[20px] h-5 rounded-full bg-primary-500 text-white text-xs font-semibold flex items-center justify-center px-1.5 shrink-0">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">Tin nhắn trực tiếp</p>
      </div>
    </button>
  );
}

// ── Group item ────────────────────────────────────────────────────────────────

function GroupItem({
  group,
  isActive,
  unread,
  onSelect,
}: {
  group: ChatGroup;
  isActive: boolean;
  unread: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
        isActive ? "bg-primary-50 border-r-2 border-primary-500" : "hover:bg-gray-50",
      )}
    >
      <GroupAvatar group={group} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn("text-sm font-medium truncate", isActive ? "text-primary-700" : "text-gray-900")}>
            {group.name ?? "Nhóm chat"}
          </span>
          {unread > 0 && (
            <span className="ml-1 min-w-[20px] h-5 rounded-full bg-primary-500 text-white text-xs font-semibold flex items-center justify-center px-1.5 shrink-0">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-gray-400">{group.member_count} thành viên</span>
          {group.my_role === "ADMIN" && (
            <span className="text-xs text-primary-500 font-medium">· Quản trị</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Main GroupList ────────────────────────────────────────────────────────────

export function GroupList({ selectedGroupId, currentUserId, onSelect, onCreateGroup, onNewDm }: GroupListProps) {
  const { data: groups, isLoading } = useMyGroups();
  const unreadByGroup = useChatStore((s) => s.unreadByGroup);
  const [search, setSearch] = useState("");

  const filtered = (groups ?? []).filter((g) => {
    if (g.is_direct) return true; // DM name resolved async; always show, filter by search later
    return (g.name ?? "").toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Tin nhắn</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewDm}
              title="Nhắn tin riêng"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button
              onClick={onCreateGroup}
              title="Tạo nhóm mới"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z"
            />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm nhóm..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-lg border-0 outline-none focus:ring-2 focus:ring-primary-300 placeholder-gray-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center pt-8">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm px-4">
            {search ? "Không tìm thấy nhóm" : "Chưa có nhóm nào"}
          </div>
        ) : (
          <ul className="py-2">
            {filtered.map((group) => {
              const unread = unreadByGroup[group.id] ?? 0;
              const isActive = selectedGroupId === group.id;
              return (
                <li key={group.id}>
                  {group.is_direct ? (
                    <DmGroupItem
                      group={group}
                      currentUserId={currentUserId}
                      isActive={isActive}
                      unread={unread}
                      onSelect={() => onSelect(group)}
                    />
                  ) : (
                    <GroupItem
                      group={group}
                      isActive={isActive}
                      unread={unread}
                      onSelect={() => onSelect(group)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
