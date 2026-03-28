import { useEffect, useState } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { Header } from "./Header";
import { Navbar } from "./Navbar";
import type { NavItem } from "./Navbar";
import { ChatNotificationProvider } from "@/components/chat/ChatNotificationProvider";
import { useUserStore } from "@/store/userStore";
import { useMyGroups } from "@/hooks/useChatGroups";

const navItems: NavItem[] = [
  { to: "/", label: "nav.dashboard" },
  { to: "/articles", label: "nav.articles" },
  { to: "/blog", label: "nav.blog" },
  { to: "/chat", label: "nav.chat" },
  { to: "/users", label: "nav.users" },
  { to: "/sources", label: "nav.sources" },
  { to: "/topics", label: "nav.topics" },
  { to: "/favorites", label: "nav.favorites" },
  { to: "/view-history", label: "nav.viewHistory" },
];

export function MainLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useRouterState({ select: (s) => s.location.pathname });
  const isChatPage = location === "/chat";
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  // Prefetch danh sách nhóm khi đã login để ChatNotificationProvider subscribe đủ /topic/chat/{groupId}
  // (xem docs/MESSAGE_UNREAD_BADGE_API.md — badge icon tin nhắn dựa vào state local + STOMP chat).
  useMyGroups({ enabled: isAuthenticated });

  // Keep --app-height in sync with visual viewport (handles mobile keyboard).
  useVisualViewport();

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setMobileNavOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      <ChatNotificationProvider />
      <Header onMenuClick={() => setMobileNavOpen((o) => !o)} />
      <div className="flex min-h-0 min-w-0 flex-1">
        <Navbar
          items={navItems}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
        <main
          className={
            isChatPage
              ? "flex min-h-0 min-w-0 flex-1 overflow-hidden bg-gray-50 p-4 sm:p-6"
              : "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-gray-50 p-4 pb-6 sm:p-6 sm:pb-6"
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
