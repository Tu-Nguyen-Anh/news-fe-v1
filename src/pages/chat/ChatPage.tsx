import { useState, useCallback, useEffect } from "react";
import { GroupList } from "@/components/chat/GroupList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { GroupInfoModal } from "@/components/chat/GroupInfoModal";
import { CreateGroupModal } from "@/components/chat/CreateGroupModal";
import { NewDirectMessageModal } from "@/components/chat/NewDirectMessageModal";
import { useChatStore } from "@/store/chatStore";
import { useUserStore } from "@/store/userStore";
import { useMyGroups, useOpenDirectMessage } from "@/hooks/useChatGroups";
import { cn } from "@/utils/cn";
import type { ChatGroup } from "@/types";

export default function ChatPage() {
  const user = useUserStore((s) => s.user);
  const { setActiveGroup } = useChatStore();
  const { data: groups, refetch } = useMyGroups();

  // Rời trang chat → không còn "đang xem" nhóm nào; nếu giữ activeGroupId, tin mới sẽ không tăng badge (store so sánh với active).
  useEffect(() => {
    return () => setActiveGroup(null);
  }, [setActiveGroup]);

  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showNewDm, setShowNewDm] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Record<number, boolean>>({});
  const openDm = useOpenDirectMessage();

  const handleOnlineUsersChange = useCallback((users: Record<number, boolean>) => {
    setOnlineUsers(users);
  }, []);

  const handleSelectGroup = (group: ChatGroup) => {
    setSelectedGroup(group);
    setActiveGroup(group.id);
    setShowMobileSidebar(false);
    setShowInfo(false);
  };

  const handleGroupDeleted = () => {
    setSelectedGroup(null);
    setActiveGroup(null);
    setShowInfo(false);
  };

  const handleGroupLeft = () => {
    setSelectedGroup(null);
    setActiveGroup(null);
    setShowInfo(false);
  };

  const handleDm = (userId: number) => {
    openDm.mutate(userId, {
      onSuccess: (group) => {
        handleSelectGroup(group);
      },
    });
  };

  const handleCreated = async (groupId: number) => {
    setShowCreate(false);
    await refetch();
    const fresh = groups?.find((g) => g.id === groupId);
    if (fresh) handleSelectGroup(fresh);
  };

  if (!user) return null;

  return (
    // flex-1 min-h-0 fills the parent flex column (main), providing a definite height
    <div className="flex flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex-shrink-0 w-full sm:w-72 md:w-64 lg:w-72 border-r border-gray-100 dark:border-gray-700 flex flex-col",
          showMobileSidebar ? "flex" : "hidden sm:flex",
        )}
      >
        <GroupList
          selectedGroupId={selectedGroup?.id ?? null}
          currentUserId={user.id}
          onSelect={handleSelectGroup}
          onCreateGroup={() => setShowCreate(true)}
          onNewDm={() => setShowNewDm(true)}
        />
      </div>

      {/* ── Chat area ───────────────────────────────────────────────────── */}
      {selectedGroup ? (
        <div
          className={cn(
            "flex-1 flex flex-col min-h-0 min-w-0",
            showMobileSidebar ? "hidden sm:flex" : "flex",
          )}
        >
          <ChatWindow
            group={selectedGroup}
            currentUserId={user.id}
            onOpenInfo={() => setShowInfo((v) => !v)}
            onBack={() => setShowMobileSidebar(true)}
            onOnlineUsersChange={handleOnlineUsersChange}
            onDm={handleDm}
          />
        </div>
      ) : (
        <div
          className={cn(
            "flex-1 flex-col items-center justify-center text-gray-400 dark:text-gray-500",
            showMobileSidebar ? "hidden sm:flex" : "flex",
          )}
        >
          <svg className="w-20 h-20 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
          <p className="text-sm font-medium">Chọn một nhóm để bắt đầu trò chuyện</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-5 py-2 text-sm font-medium bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            Tạo nhóm mới
          </button>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showInfo && selectedGroup && (
        <GroupInfoModal
          group={selectedGroup}
          currentUserId={user.id}
          onClose={() => setShowInfo(false)}
          onGroupDeleted={handleGroupDeleted}
          onGroupLeft={handleGroupLeft}
          onDm={handleDm}
          onlineUsers={onlineUsers}
        />
      )}

      {showCreate && (
        <CreateGroupModal
          currentUserId={user.id}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => void handleCreated(id)}
        />
      )}

      {showNewDm && (
        <NewDirectMessageModal
          currentUserId={user.id}
          onOpen={handleSelectGroup}
          onClose={() => setShowNewDm(false)}
        />
      )}
    </div>
  );
}

