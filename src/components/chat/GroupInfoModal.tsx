import { useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { useGroupDetail, useRemoveMember, useMakeAdmin, useDeleteGroup, useAddMember, useLeaveGroup } from "@/hooks/useChatGroups";
import { userService } from "@/services/userService";
import { MemberPopup } from "./MemberPopup";
import { Spinner } from "@/components/ui";
import type { AxiosError } from "axios";
import type { ChatGroup, ChatGroupMember, User } from "@/types";

interface GroupInfoModalProps {
  group: ChatGroup;
  currentUserId: number;
  onClose: () => void;
  onGroupDeleted: () => void;
  onGroupLeft: () => void;
  onDm?: (userId: number) => void;
  onlineUsers?: Record<number, boolean>;
}

// ── Add member inline search ───────────────────────────────────────────────────

function AddMemberSection({
  groupId,
  currentUserId,
  existingIds,
}: {
  groupId: number;
  currentUserId: number;
  existingIds: Set<number>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const addMember = useAddMember(groupId);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const page = await userService.filter({ keyword: q, page: 0, size: 8 });
      setResults(page.content.filter((u) => u.id !== currentUserId && !existingIds.has(u.id)));
    } finally { setSearching(false); }
  };

  return (
    <div className="px-4 pb-3 border-b border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Thêm thành viên</p>
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
        </svg>
        <input
          value={query}
          onChange={(e) => void handleSearch(e.target.value)}
          placeholder="Tìm người dùng..."
          className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100"
        />
      </div>
      {searching && <p className="text-xs text-gray-400 mt-1 text-center">Đang tìm...</p>}
      {results.length > 0 && (
        <div className="mt-1.5 max-h-32 overflow-y-auto border border-gray-100 rounded-lg">
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => addMember.mutate({ user_id: u.id }, { onSuccess: () => setResults((p) => p.filter((x) => x.id !== u.id)) })}
              disabled={addMember.isPending}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50"
            >
              {u.avatar
                ? <img src={u.avatar} alt={u.full_name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                : <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">{u.full_name[0]?.toUpperCase()}</div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{u.full_name}</p>
                <p className="text-[11px] text-gray-400">@{u.username}</p>
              </div>
              <span className="text-[11px] text-primary-600 font-medium shrink-0">+ Thêm</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Member row ────────────────────────────────────────────────────────────────

function MemberRow({
  member,
  canManage,
  isMe,
  groupId,
  currentUserId,
  onClickAvatar,
  isOnline,
}: {
  member: ChatGroupMember;
  canManage: boolean;
  isMe: boolean;
  groupId: number;
  currentUserId: number;
  onClickAvatar: (member: ChatGroupMember, rect: DOMRect) => void;
  isOnline?: boolean;
}) {
  const removeMutation = useRemoveMember(groupId);
  const adminMutation = useMakeAdmin(groupId);
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);

  const handleAvatarClick = () => {
    const rect = avatarRef.current?.getBoundingClientRect();
    if (rect) onClickAvatar(member, rect);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-lg group">
      <button ref={avatarRef} onClick={handleAvatarClick} className="relative shrink-0 focus:outline-none">
        {member.avatar
          ? <img src={member.avatar} alt={member.full_name} className="w-9 h-9 rounded-full object-cover hover:ring-2 hover:ring-primary-300 transition-all" />
          : <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm hover:ring-2 hover:ring-primary-300 transition-all">
              {member.full_name[0]?.toUpperCase()}
            </div>
        }
        {isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-white" />
        )}
      </button>

      <button onClick={handleAvatarClick} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900 truncate hover:text-primary-600 transition-colors">{member.full_name}</span>
          {isMe && <span className="text-xs text-gray-400">(bạn)</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-gray-400">@{member.username}</span>
          {member.role === "ADMIN" && (
            <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full border border-primary-100">Admin</span>
          )}
          {isOnline !== undefined && (
            <span className={isOnline ? "text-[10px] text-emerald-500 font-medium" : "text-[10px] text-gray-300"}>
              {isOnline ? "● online" : "● offline"}
            </span>
          )}
        </div>
      </button>

      {canManage && member.user_id !== currentUserId && (
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1">
                {member.role !== "ADMIN" && (
                  <button
                    onClick={() => { adminMutation.mutate(member.user_id); setMenuOpen(false); }}
                    disabled={adminMutation.isPending}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-yellow-50 disabled:opacity-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Nhượng quyền Admin
                  </button>
                )}
                <button
                  onClick={() => { if (confirm(`Xóa ${member.full_name} khỏi nhóm?`)) removeMutation.mutate(member.user_id); setMenuOpen(false); }}
                  disabled={removeMutation.isPending}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Xóa khỏi nhóm
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function GroupInfoModal({ group, currentUserId, onClose, onGroupDeleted, onGroupLeft, onDm, onlineUsers }: GroupInfoModalProps) {
  const { data: detail, isLoading } = useGroupDetail(group.id);
  const deleteGroup = useDeleteGroup();
  const leaveGroup = useLeaveGroup();
  const isAdmin = group.my_role === "ADMIN";
  const [memberPopup, setMemberPopup] = useState<{ member: ChatGroupMember; rect: DOMRect } | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const existingIds = new Set((detail?.members ?? []).map((m) => m.user_id));
  const isDirect = group.is_direct;

  const colors = ["from-violet-400 to-violet-600", "from-blue-400 to-blue-600", "from-emerald-400 to-emerald-600", "from-orange-400 to-orange-600", "from-pink-400 to-pink-600", "from-teal-400 to-teal-600"];
  const gradient = colors[group.id % colors.length];

  const displayName = isDirect
    ? (detail?.members.find((m) => m.user_id !== currentUserId)?.full_name ?? "Tin nhắn riêng")
    : (group.name ?? "Nhóm chat");

  const handleLeave = () => {
    setLeaveError(null);
    if (!confirm(`Bạn có chắc muốn rời khỏi "${displayName}"?`)) return;
    leaveGroup.mutate(group.id, {
      onSuccess: () => onGroupLeft(),
      onError: (err) => {
        const msg = (err as AxiosError<{ message?: string }>).response?.data?.message;
        if (msg?.includes("CannotLeaveGroup") || (err as AxiosError).response?.status === 400) {
          setLeaveError("Bạn là admin duy nhất của nhóm. Hãy chỉ định admin mới trước khi rời nhóm.");
        } else {
          setLeaveError("Không thể rời nhóm. Vui lòng thử lại.");
        }
      },
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel – slides in from right */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[min(340px,100vw)] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 z-10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Group header */}
        <div className={cn("h-24 bg-gradient-to-br shrink-0", gradient)} />
        <div className="flex flex-col items-center -mt-10 px-4 pb-5 border-b border-gray-100 shrink-0">
          {group.avatar
            ? <img src={group.avatar} alt={displayName} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
            : <div className={cn("w-20 h-20 rounded-full border-4 border-white shadow-md bg-gradient-to-br flex items-center justify-center text-white text-2xl font-bold", gradient)}>
                {displayName[0]?.toUpperCase()}
              </div>
          }
          <div className="mt-3 flex items-center gap-1.5">
            <h3 className="text-base font-bold text-gray-900 text-center leading-tight">{displayName}</h3>
            {isDirect && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">DM</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">{group.member_count} thành viên</p>
          {!isDirect && (
            <span className={cn("mt-2 text-xs font-semibold px-3 py-1 rounded-full", isAdmin ? "bg-primary-50 text-primary-700 border border-primary-100" : "bg-gray-100 text-gray-500")}>
              {isAdmin ? "Quản trị viên" : "Thành viên"}
            </span>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Add member section (admin, non-DM only) */}
          {isAdmin && !isDirect && (
            <div className="pt-4">
              <div className="px-4 pb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Thêm thành viên</span>
                <button
                  onClick={() => setShowAddMember((v) => !v)}
                  className={cn("text-xs font-medium transition-colors", showAddMember ? "text-gray-400" : "text-primary-600 hover:text-primary-700")}
                >
                  {showAddMember ? "Ẩn" : "+ Thêm"}
                </button>
              </div>
              {showAddMember && (
                <AddMemberSection groupId={group.id} currentUserId={currentUserId} existingIds={existingIds} />
              )}
            </div>
          )}

          {/* Member list */}
          <div className="pt-4">
            <div className="px-4 pb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Thành viên ({detail?.members.length ?? "…"})
              </span>
            </div>

            {isLoading
              ? <div className="flex justify-center py-8"><Spinner /></div>
              : (
                <div className="space-y-0.5 px-2 pb-4">
                  {(detail?.members ?? []).map((member) => (
                    <MemberRow
                      key={member.member_id}
                      member={member}
                      canManage={isAdmin && !isDirect}
                      isMe={member.user_id === currentUserId}
                      groupId={group.id}
                      currentUserId={currentUserId}
                      onClickAvatar={(m, rect) => setMemberPopup({ member: m, rect })}
                      isOnline={onlineUsers ? onlineUsers[member.user_id] : undefined}
                    />
                  ))}
                </div>
              )
            }
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 p-4 shrink-0 space-y-2">
          {!isDirect && (
            <>
              {/* Leave group – all members */}
              {leaveError && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{leaveError}</p>
              )}
              <button
                onClick={handleLeave}
                disabled={leaveGroup.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {leaveGroup.isPending ? "Đang rời nhóm..." : "Rời nhóm"}
              </button>
              {/* Delete group – admin only */}
              {isAdmin && (
                <button
                  onClick={() => { if (confirm(`Xóa nhóm "${displayName}"? Không thể hoàn tác.`)) deleteGroup.mutate(group.id, { onSuccess: onGroupDeleted }); }}
                  disabled={deleteGroup.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleteGroup.isPending ? "Đang xóa..." : "Giải tán nhóm"}
                </button>
              )}
            </>
          )}
          {/* Delete DM – any member */}
          {isDirect && (
            <button
              onClick={() => { if (confirm("Xóa cuộc trò chuyện này? Không thể hoàn tác.")) deleteGroup.mutate(group.id, { onSuccess: onGroupDeleted }); }}
              disabled={deleteGroup.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleteGroup.isPending ? "Đang xóa..." : "Xóa cuộc trò chuyện"}
            </button>
          )}
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
    </>
  );
}
