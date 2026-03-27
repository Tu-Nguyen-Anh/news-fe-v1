import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { SafeImage } from "@/components/ui/SafeImage";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Link } from "@tanstack/react-router";
import { useChatStore } from "@/store/chatStore";

function ChatIconButton() {
  const totalUnread = useChatStore((s) => s.totalUnread);
  return (
    <Link
      to="/chat"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label="Tin nhắn"
      title="Tin nhắn"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {totalUnread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] animate-pulse items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
          {totalUnread > 99 ? "99+" : totalUnread}
        </span>
      )}
    </Link>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export type HeaderProps = {
  onMenuClick?: () => void;
};

export function Header({ onMenuClick }: HeaderProps = {}) {
  const { user, logout, isLoggingOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const initial =
    user?.full_name?.trim()?.[0]?.toUpperCase() ?? user?.username?.trim()?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          {onMenuClick ? (
            <button
              type="button"
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
              aria-label="Mở menu điều hướng"
              onClick={onMenuClick}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          ) : null}
          <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">news</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user && (
            <>
              <span className="hidden max-w-[min(12rem,40vw)] truncate text-sm font-medium text-gray-700 sm:block sm:max-w-[14rem] md:max-w-none">
                {user.full_name}
              </span>
              {/* Chat icon */}
              <ChatIconButton />
              {/* Notification bell */}
              <NotificationBell />
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50 hover:border-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                aria-label="Xem hồ sơ"
                title="Xem hồ sơ"
              >
                {user.avatar ? (
                  <SafeImage src={user.avatar} alt={user.full_name} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-gray-700">{initial}</span>
                )}
              </button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => logout()} isLoading={isLoggingOut}>
            <span className="hidden sm:inline">Đăng xuất</span>
            <span className="sm:hidden">Thoát</span>
          </Button>
        </div>
      </div>

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} className="max-w-lg">
        <ModalHeader
          title="Hồ sơ cá nhân"
          subtitle={user ? `@${user.username}` : undefined}
          onClose={() => setProfileOpen(false)}
          icon={
            user ? (
              user.avatar ? (
                <SafeImage src={user.avatar} alt={user.full_name} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-indigo-700">{initial}</span>
              )
            ) : (
              <span className="text-sm font-bold text-indigo-700">U</span>
            )
          }
          accent="indigo"
        />
        <ModalBody>
          {user ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Email</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">{user.email}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Số điện thoại</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">{user.phone_number ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">User ID</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">{user.id}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Trạng thái</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">
                    {user.status === 0 ? "Hoạt động" : user.status === 1 ? "Vô hiệu hóa" : "Không xác định"}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Tên</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">{user.full_name}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Không có dữ liệu hồ sơ.</div>
          )}
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={() => setProfileOpen(false)}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </ModalFooter>
      </Modal>
    </header>
  );
}
