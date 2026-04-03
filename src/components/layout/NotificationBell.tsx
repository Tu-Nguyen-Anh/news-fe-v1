import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMarkAllAsRead, useMarkAsRead, useNotifications, useUnreadCount } from "@/hooks/useNotifications";
import { cn } from "@/utils/cn";
import type { Notification } from "@/types";

const BASE_TITLE = "News";

function formatRelativeTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  if (h < 24) return `${h} giờ trước`;
  if (d < 7) return `${d} ngày trước`;
  return new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const PAGE_SIZE = 15;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data, isPending } = useNotifications(page, PAGE_SIZE);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const prevUnreadRef = useRef<number>(unreadCount);
  const toastTimeoutRef = useRef<number | null>(null);
  const blinkIntervalRef = useRef<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function stopBlink() {
    if (blinkIntervalRef.current) window.clearInterval(blinkIntervalRef.current);
    blinkIntervalRef.current = null;
    document.title = BASE_TITLE;
  }

  function startBlink(count: number) {
    if (blinkIntervalRef.current) window.clearInterval(blinkIntervalRef.current);

    let toggle = false;
    document.title = `(${count}) ${BASE_TITLE}`;
    blinkIntervalRef.current = window.setInterval(() => {
      toggle = !toggle;
      document.title = toggle ? `(${count}) ${BASE_TITLE}` : BASE_TITLE;
    }, 700);
  }

  function showToast(message: string) {
    setToast(message);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 3800);
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reset page when closing
  useEffect(() => {
    if (!open) setPage(0);
  }, [open]);

  // When user opens dropdown, stop any blinking and hide toast.
  useEffect(() => {
    if (!open) return;
    setToast(null);
    stopBlink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleNotificationClick(notif: Notification) {
    if (!notif.is_read) markAsRead.mutate(notif.id);
    navigate({ to: "/articles/$id", params: { id: String(notif.article_id) } });
    setOpen(false);
  }

  const totalPages = data ? Math.ceil(data.amount / PAGE_SIZE) : 0;

  function handleBellClick() {
    // Always refresh notification data when user clicks the bell.
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    setOpen((prev) => {
      const next = !prev;
      if (next) setPage(0);
      return next;
    });
  }

  // React when unread count increases.
  useEffect(() => {
    const prev = prevUnreadRef.current;
    if (unreadCount > prev) {
      const delta = unreadCount - prev;
      const message = unreadCount > 0 ? `Bạn có ${unreadCount} thông báo mới chưa đọc` : `Bạn có ${delta} thông báo mới`;

      if (document.visibilityState === "visible") {
        // Show compact toast on screen.
        if (!open) showToast(message);
      } else {
        // Blink browser tab title when in another tab.
        if (!open) startBlink(unreadCount);
      }
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, open]);

  // Restore title when the tab becomes visible again.
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") {
        stopBlink();
        setToast(null);
        return;
      }

      if (!open && unreadCount > 0) startBlink(unreadCount);
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [open, unreadCount]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
      if (blinkIntervalRef.current) window.clearInterval(blinkIntervalRef.current);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Compact toast (top-right) */}
      {toast ? (
        <div className="fixed right-3 top-[3.8rem] sm:top-20 z-[60] w-[calc(100vw-1.5rem)] max-w-sm sm:max-w-xs rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl">
          <div className="flex items-start gap-3 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Thông báo</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{toast}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-lg p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Đóng thông báo"
              title="Đóng"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                <path d="M18 6 6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
      {/* Bell button */}
      <button
        type="button"
        onClick={handleBellClick}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
          open ? "bg-indigo-50 text-indigo-600" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200",
        )}
        aria-label="Thông báo"
        title="Thông báo"
      >
        {/* Bell SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("h-5 w-5 transition-transform", open && "scale-110")}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] animate-pulse items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="fixed right-2 top-[3.6rem] z-50 w-[calc(100vw-1rem)] max-w-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl sm:absolute sm:right-0 sm:top-11 sm:w-80 sm:max-w-none md:w-96">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800 disabled:opacity-50"
              >
                {markAllAsRead.isPending ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[min(420px,55dvh)] overflow-y-auto">
            {isPending ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex animate-pulse items-start gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-4/5 rounded bg-gray-200" />
                      <div className="h-2.5 w-1/3 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data?.content.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-400">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Không có thông báo</p>
                <p className="mt-0.5 text-xs text-gray-400">Bạn sẽ được thông báo khi có @mention</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 dark:divide-gray-700">
                {data.content.map((notif) => (
                  <li key={notif.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        "group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700",
                        !notif.is_read && "bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/30",
                      )}
                    >
                      {/* Sender avatar */}
                      <div className="relative shrink-0 pt-0.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-bold text-white">
                          {getInitials(notif.sender_full_name)}
                        </div>
                        {/* Type icon badge */}
                        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            !notif.is_read ? "font-semibold text-gray-900 dark:text-gray-100" : "font-medium text-gray-700 dark:text-gray-200",
                          )}
                        >
                          {notif.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(notif.created_at)}</p>
                      </div>

                      {/* Unread dot */}
                      {!notif.is_read && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-b-2xl border-t border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 px-4 py-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-40"
              >
                ← Trước
              </button>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-40"
              >
                Tiếp →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
