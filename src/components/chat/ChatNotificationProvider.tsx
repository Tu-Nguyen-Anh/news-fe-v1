import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/store/userStore";
import { useChatStore } from "@/store/chatStore";
import { storage } from "@/utils/storage";
import type { ChatMessage, ChatGroup, PageResponse, Notification } from "@/types";
import { chatKeys } from "@/hooks/useChatGroups";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const WS_BASE = API_BASE.replace(/\/api\/v\d+\/?$/, "");

export function ChatNotificationProvider() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const qc = useQueryClient();
  const clientRef = useRef<Client | null>(null);
  const subscribedGroupsRef = useRef<Set<number>>(new Set());

  // ── Helper: subscribe to notification topic for current user ──────────
  function subscribeToNotifications(client: Client) {
    const userId = useUserStore.getState().user?.id;
    if (!userId) return;

    client.subscribe(`/topic/notifications/${userId}`, (frame) => {
      const notification: Notification = JSON.parse(frame.body);

      // Increment unread count instantly (no network roundtrip)
      qc.setQueryData<number>(["notifications", "unread-count"], (prev) => (prev ?? 0) + 1);

      // Prepend to first page of notification list if it's cached
      qc.setQueryData<PageResponse<Notification>>(
        ["notifications", 0, 15],
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            content: [notification, ...prev.content],
            amount: prev.amount + 1,
          };
        },
      );

      // Refresh group list in case a new DM was initiated alongside this notification
      void qc.invalidateQueries({ queryKey: chatKeys.groups() });
    });
  }

  // ── Helper: subscribe to a chat group topic ────────────────────────────
  function subscribeToGroup(client: Client, groupId: number) {
    if (subscribedGroupsRef.current.has(groupId)) return;
    subscribedGroupsRef.current.add(groupId);

    client.subscribe(`/topic/chat/${groupId}`, (frame) => {
      const msg: ChatMessage = JSON.parse(frame.body);

      // Cache live message
      qc.setQueryData<ChatMessage[]>(
        [...chatKeys.messages(groupId), "live"],
        (prev) => {
          if ((prev ?? []).some((m) => m.id === msg.id)) return prev ?? [];
          return [...(prev ?? []), msg];
        },
      );

      // Read activeGroupId fresh from store (avoid stale closure)
      const activeGroupId = useChatStore.getState().activeGroupId;
      if (msg.group_id !== activeGroupId) {
        useChatStore.getState().incrementUnread(groupId);
      }

      void qc.invalidateQueries({ queryKey: chatKeys.groups() });
    });
  }

  // ── Browser tab title: driven by totalUnread in store ─────────────────
  useEffect(() => {
    return useChatStore.subscribe((state) => {
      const base = "News";
      document.title = state.totalUnread > 0 ? `(${state.totalUnread}) ${base}` : base;
    });
  }, []);

  // ── WebSocket lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = storage.getToken();
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        const groups = qc.getQueryData<ChatGroup[]>(chatKeys.groups()) ?? [];
        groups.forEach((g) => subscribeToGroup(client, g.id));
        subscribeToNotifications(client);
      },
      onStompError: () => {/* silent – auto-reconnect */},
    });

    clientRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
      clientRef.current = null;
      subscribedGroupsRef.current.clear();
    };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Subscribe to newly created groups after group list changes ─────────
  // We run this on every render but guard with the Set so it's idempotent
  useEffect(() => {
    const client = clientRef.current;
    if (!client?.connected) return;
    const groups = qc.getQueryData<ChatGroup[]>(chatKeys.groups()) ?? [];
    groups.forEach((g) => {
      if (!subscribedGroupsRef.current.has(g.id)) subscribeToGroup(client, g.id);
    });
  });

  return null;
}
