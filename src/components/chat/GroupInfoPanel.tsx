import { useState } from "react";
import { cn } from "@/utils/cn";
import { useGroupDetail, useRemoveMember, useMakeAdmin, useDeleteGroup } from "@/hooks/useChatGroups";
import type { ChatGroup, ChatGroupMember } from "@/types";
import { Spinner } from "@/components/ui";

interface GroupInfoPanelProps {
  group: ChatGroup;
  currentUserId: number;
  onClose: () => void;
  onAddMember: () => void;
  onGroupDeleted: () => void;
}

function MemberRow({
  member,
  canManage,
  isMe,
  groupId,
  currentUserId,
}: {
  member: ChatGroupMember;
  canManage: boolean;
  isMe: boolean;
  groupId: number;
  currentUserId: number;
}) {
  const removeMutation = useRemoveMember(groupId);
  const adminMutation = useMakeAdmin(groupId);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-lg group relative">
      {/* Avatar */}
      {member.avatar ? (
        <img
          src={member.avatar}
          alt={member.full_name}
          className="w-9 h-9 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm shrink-0">
          {member.full_name[0]?.toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900 truncate">{member.full_name}</span>
          {isMe && <span className="text-xs text-gray-400">(bạn)</span>}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">@{member.username}</span>
          {member.role === "ADMIN" && (
            <span className="text-xs font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
              Admin
            </span>
          )}
        </div>
      </div>

      {/* Actions menu – admin only, not for self */}
      {canManage && !isMe && member.user_id !== currentUserId && (
        <div className="relative">
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
              <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden py-1">
                {member.role !== "ADMIN" && (
                  <button
                    onClick={() => {
                      adminMutation.mutate(member.user_id);
                      setMenuOpen(false);
                    }}
                    disabled={adminMutation.isPending}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                    </svg>
                    Nhượng quyền Admin
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Xóa ${member.full_name} khỏi nhóm?`)) {
                      removeMutation.mutate(member.user_id);
                    }
                    setMenuOpen(false);
                  }}
                  disabled={removeMutation.isPending}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
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

export function GroupInfoPanel({
  group,
  currentUserId,
  onClose,
  onAddMember,
  onGroupDeleted,
}: GroupInfoPanelProps) {
  const { data: detail, isLoading } = useGroupDetail(group.id);
  const deleteGroup = useDeleteGroup();
  const isAdmin = group.my_role === "ADMIN";

  const handleDelete = () => {
    if (confirm(`Xóa nhóm "${group.name ?? "này"}"? Hành động này không thể hoàn tác.`)) {
      deleteGroup.mutate(group.id, {
        onSuccess: () => onGroupDeleted(),
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">Thông tin nhóm</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Group avatar + name */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-gray-100">
        {group.avatar ? (
          <img
            src={group.avatar}
            alt={group.name ?? "Nhóm chat"}
            className="w-16 h-16 rounded-full object-cover mb-3"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl mb-3">
            {(group.name ?? "G")[0]?.toUpperCase()}
          </div>
        )}
        <h4 className="font-semibold text-gray-900 text-center">{group.name ?? "Nhóm chat"}</h4>
        <p className="text-sm text-gray-400 mt-1">{group.member_count} thành viên</p>
        <p className="text-xs text-gray-300 mt-1">
          {group.my_role === "ADMIN" ? "Bạn là quản trị viên" : "Thành viên"}
        </p>
      </div>

      {/* Members */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Thành viên
          </span>
          {isAdmin && (
            <button
              onClick={onAddMember}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {(detail?.members ?? []).map((member) => (
              <MemberRow
                key={member.member_id}
                member={member}
                canManage={isAdmin}
                isMe={member.user_id === currentUserId}
                groupId={group.id}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      {isAdmin && (
        <div className="border-t border-gray-100 p-4">
          <button
            onClick={handleDelete}
            disabled={deleteGroup.isPending}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50",
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleteGroup.isPending ? "Đang xóa..." : "Xóa nhóm"}
          </button>
        </div>
      )}
    </div>
  );
}
