import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import { useChatStore } from "@/store/chatStore";

export interface NavItem {
  to: string;
  label: string;
  icon?: ReactNode;
}

interface NavbarLinkListProps {
  items: NavItem[];
  onNavigate?: () => void;
}

const linkBase =
  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors sm:py-2";

function NavbarLinkList({ items, onNavigate }: NavbarLinkListProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const totalUnread = useChatStore((s) => s.totalUnread);

  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.to}>
          <Link
            to={item.to}
            activeOptions={{ exact: true }}
            onClick={() => {
              // Khi chuyển tab bất kỳ, gọi lại số lượng thông báo chưa đọc mới nhất.
              void queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
              onNavigate?.();
            }}
            className={cn(linkBase)}
            activeProps={{
              className: "bg-primary-50 text-primary-700",
            }}
            inactiveProps={{
              className: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
            }}
          >
            {item.icon && <span className="h-5 w-5 shrink-0">{item.icon}</span>}
            <span className="flex-1">{t(item.label)}</span>
            {item.to === "/chat" && totalUnread > 0 && (
              <span className="ml-auto min-w-[20px] h-5 rounded-full bg-primary-500 text-white text-xs font-semibold flex items-center justify-center px-1.5 shrink-0">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

interface NavbarProps {
  items: NavItem[];
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Navbar({ items, mobileOpen = false, onMobileClose }: NavbarProps) {
  return (
    <div className="contents">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileOpen}
        onClick={() => onMobileClose?.()}
      />

      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-gray-200 bg-gray-50 p-4 shadow-xl transition-transform duration-200 ease-out md:hidden dark:border-gray-700 dark:bg-gray-900",
          mobileOpen ? "translate-x-0" : "pointer-events-none -translate-x-full",
        )}
        aria-label="Điều hướng"
        aria-hidden={!mobileOpen}
      >
        <NavbarLinkList items={items} onNavigate={onMobileClose} />
      </nav>

      <nav
        className="hidden w-52 shrink-0 flex-col border-r border-gray-200 bg-gray-50 p-4 md:flex lg:w-56 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto sm:top-16 sm:h-[calc(100vh-4rem)] dark:border-gray-700 dark:bg-gray-900"
        aria-label="Điều hướng chính"
      >
        <NavbarLinkList items={items} />
      </nav>
    </div>
  );
}
