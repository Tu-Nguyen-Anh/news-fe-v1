import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { SafeImage } from "@/components/ui/SafeImage";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Link } from "@tanstack/react-router";
import { useChatStore } from "@/store/chatStore";
import { useThemeStore } from "@/store/themeStore";
import { useMutation } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { TextField } from "@/components/ui/TextField";

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

function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === "dark" ? "Chuyển sang sáng" : "Chuyển sang tối"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function ChangePasswordModal({ open, onClose, userId }: { open: boolean; onClose: () => void; userId: number }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ old?: string; new?: string; confirm?: string; api?: string }>({});
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      userService.changePassword(userId, {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    onSuccess: () => {
      setSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Đổi mật khẩu thất bại")
          : "Đổi mật khẩu thất bại";
      setErrors((e) => ({ ...e, api: msg }));
    },
  });

  function validate() {
    const e: typeof errors = {};
    if (!oldPassword) e.old = "Vui lòng nhập mật khẩu cũ";
    if (!newPassword) e.new = "Vui lòng nhập mật khẩu mới";
    else if (newPassword.length < 8) e.new = "Mật khẩu mới ít nhất 8 ký tự";
    if (!confirmPassword) e.confirm = "Vui lòng xác nhận mật khẩu";
    else if (confirmPassword !== newPassword) e.confirm = "Xác nhận mật khẩu không khớp";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    mutation.mutate();
  }

  function handleClose() {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setSuccess(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} className="max-w-md">
      <ModalHeader
        title="Đổi mật khẩu"
        onClose={handleClose}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        }
        accent="indigo"
      />
      <ModalBody>
        {success ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-emerald-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Đổi mật khẩu thành công!</p>
          </div>
        ) : (
          <form id="change-password-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errors.api && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errors.api}</div>
            )}
            <TextField
              id="old-password"
              label="Mật khẩu cũ"
              type="password"
              fullWidth
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              error={errors.old}
              autoComplete="current-password"
            />
            <TextField
              id="new-password"
              label="Mật khẩu mới"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.new}
              autoComplete="new-password"
              helperText="Ít nhất 8 ký tự, có chữ hoa, số và ký tự đặc biệt"
            />
            <TextField
              id="confirm-password"
              label="Xác nhận mật khẩu mới"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirm}
              autoComplete="new-password"
            />
          </form>
        )}
      </ModalBody>
      <ModalFooter>
        {success ? (
          <Button variant="primary" size="sm" onClick={handleClose}>Đóng</Button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="change-password-form"
              isLoading={mutation.isPending}
            >
              Xác nhận
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}

export function Header({ onMenuClick }: HeaderProps = {}) {
  const { user, logout, isLoggingOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const initial =
    user?.full_name?.trim()?.[0]?.toUpperCase() ?? user?.username?.trim()?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-14 items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          {onMenuClick ? (
            <button
              type="button"
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
              aria-label="Mở menu điều hướng"
              onClick={onMenuClick}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          ) : null}
          <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white sm:text-xl">news</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user && (
            <>
              <span className="hidden max-w-[min(12rem,40vw)] truncate text-sm font-medium text-gray-700 dark:text-gray-300 sm:block sm:max-w-[14rem] md:max-w-none">
                {user.full_name}
              </span>
              {/* Chat icon */}
              <ChatIconButton />
              {/* Notification bell */}
              <NotificationBell />
              {/* Dark/Light toggle */}
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50 hover:border-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                aria-label="Xem hồ sơ"
                title="Xem hồ sơ"
              >
                {user.avatar ? (
                  <SafeImage src={user.avatar} alt={user.full_name} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{initial}</span>
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
            className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Đóng
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setProfileOpen(false); setChangePasswordOpen(true); }}
          >
            Đổi mật khẩu
          </Button>
        </ModalFooter>
      </Modal>

      {user && (
        <ChangePasswordModal
          open={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
          userId={user.id}
        />
      )}
    </header>
  );
}
