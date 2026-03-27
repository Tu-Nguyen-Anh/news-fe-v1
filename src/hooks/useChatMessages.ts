import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";
import { storage } from "@/utils/storage";
import { useChatStore } from "@/store/chatStore";
import { chatKeys } from "./useChatGroups";
import type {
  ChatMessage,
  PresenceEvent,
  ReadReceiptEvent,
  ReactionEvent,
  RecallEvent,
} from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const WS_BASE = API_BASE.replace(/\/api\/v\d+\/?$/, "");
const PAGE_SIZE = 30;

export function useChatMessages(groupId: number | null) {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<number, boolean>>({});
  const clientRef = useRef<Client | null>(null);
  const { clearGroupUnread } = useChatStore();

  // ── Reset and re-initialize when group changes ────────────────────────
  useEffect(() => {
    if (groupId === null) {
      setMessages([]);
      setPage(0);
      setTotal(0);
      setOnlineUsers({});
      return;
    }

    const liveKey = [...chatKeys.messages(groupId), "live"];
    const liveMessages = qc.getQueryData<ChatMessage[]>(liveKey) ?? [];

    setInitialLoading(true);
    setMessages([]);
    setPage(0);
    setOnlineUsers({});

    // Load messages + presence snapshot in parallel
    Promise.all([
      chatService.getMessages(groupId, 0, PAGE_SIZE),
      chatService.getPresence(groupId).catch(() => [] as typeof liveMessages),
    ])
      .then(([msgData, presenceData]) => {
        const historical = [...msgData.content].reverse(); // newest-first → oldest-first
        const historicalIds = new Set(historical.map((m) => m.id));
        const newLive = liveMessages.filter((m) => !historicalIds.has(m.id));
        setMessages([...historical, ...newLive]);
        setTotal(msgData.amount);
        setPage(1);
        clearGroupUnread(groupId);

        // Build online map from presence snapshot
        const onlineMap: Record<number, boolean> = {};
        // presenceData is ChatGroupMember[] with online field
        (presenceData as Array<{ user_id: number; online?: boolean | null }>).forEach((m) => {
          if (m.online !== null && m.online !== undefined) {
            onlineMap[m.user_id] = m.online;
          }
        });
        setOnlineUsers(onlineMap);

        // Mark all messages as read now that they're loaded
        void chatService.markAsRead(groupId);
      })
      .finally(() => setInitialLoading(false));

    // Connect a per-group STOMP client
    const token = storage.getToken();
    if (!token) return;

    clientRef.current?.deactivate();

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        // ── New messages ──────────────────────────────────────────────
        client.subscribe(`/topic/chat/${groupId}`, (frame) => {
          const msg: ChatMessage = JSON.parse(frame.body);
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, { ...msg, readers: [], reactions: [] }];
          });
          qc.setQueryData<ChatMessage[]>(liveKey, (prev) => {
            if ((prev ?? []).some((m) => m.id === msg.id)) return prev ?? [];
            return [...(prev ?? []), msg];
          });
          // Auto mark as read since we're actively viewing this group
          void chatService.markAsRead(groupId);
        });

        // ── Read receipts ─────────────────────────────────────────────
        client.subscribe(`/topic/chat/${groupId}/read`, (frame) => {
          const event: ReadReceiptEvent = JSON.parse(frame.body);
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id > event.last_read_message_id) return m;
              if ((m.readers ?? []).some((r) => r.user_id === event.user_id)) return m;
              return {
                ...m,
                readers: [
                  ...(m.readers ?? []),
                  {
                    user_id: event.user_id,
                    username: event.username,
                    full_name: event.full_name,
                    avatar: event.avatar,
                    read_at: event.read_at,
                  },
                ],
              };
            }),
          );
        });

        // ── Reactions ─────────────────────────────────────────────────
        client.subscribe(`/topic/chat/${groupId}/reaction`, (frame) => {
          const event: ReactionEvent = JSON.parse(frame.body);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === event.message_id ? { ...m, reactions: event.reactions } : m,
            ),
          );
        });

        // ── Recall ────────────────────────────────────────────────────
        client.subscribe(`/topic/chat/${groupId}/recall`, (frame) => {
          const event: RecallEvent = JSON.parse(frame.body);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === event.message_id
                ? { ...m, content: "Tin nhắn đã bị thu hồi", recalled: true, message_type: null, reactions: [], readers: [] }
                : m,
            ),
          );
        });

        // ── Presence ──────────────────────────────────────────────────
        client.subscribe(`/topic/chat/${groupId}/presence`, (frame) => {
          const event: PresenceEvent = JSON.parse(frame.body);
          setOnlineUsers((prev) => ({ ...prev, [event.user_id]: event.online }));
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load older messages (infinite scroll up) ─────────────────────────
  const loadMore = useCallback(async () => {
    if (!groupId || loadingMore) return;
    if (messages.length >= total && total > 0) return;

    setLoadingMore(true);
    try {
      const data = await chatService.getMessages(groupId, page, PAGE_SIZE);
      const older = [...data.content].reverse();
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const fresh = older.filter((m) => !existingIds.has(m.id));
        return [...fresh, ...prev];
      });
      setTotal(data.amount);
      setPage((p) => p + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [groupId, loadingMore, messages.length, total, page]);

  // ── Send message ──────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (content: string, messageType: "TEXT" | "EMOJI" = "TEXT") => {
      const client = clientRef.current;
      if (!client?.connected || !groupId) return;
      client.publish({
        destination: `/app/chat/${groupId}`,
        body: JSON.stringify({ content, message_type: messageType }),
      });
    },
    [groupId],
  );

  // ── Reactions ─────────────────────────────────────────────────────────
  const addReaction = useCallback(
    async (messageId: number, emoji: string) => {
      if (!groupId) return;
      try {
        const reactions = await chatService.addReaction(groupId, messageId, emoji);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
        );
      } catch {
        // WS reaction event will update state if server succeeds
      }
    },
    [groupId],
  );

  const removeReaction = useCallback(
    async (messageId: number, emoji: string) => {
      if (!groupId) return;
      try {
        const reactions = await chatService.removeReaction(groupId, messageId, emoji);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
        );
      } catch {
        // ignore
      }
    },
    [groupId],
  );

  // ── Recall message ────────────────────────────────────────────────────────
  const recallMessage = useCallback(
    async (messageId: number) => {
      if (!groupId) return;
      await chatService.recallMessage(groupId, messageId);
      // Optimistic update (WS event also updates but may be slower)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: "Tin nhắn đã bị thu hồi", recalled: true, message_type: null, reactions: [], readers: [] }
            : m,
        ),
      );
    },
    [groupId],
  );

  const hasMore = total > messages.length;

  return {
    messages,
    initialLoading,
    loadingMore,
    hasMore,
    loadMore,
    sendMessage,
    onlineUsers,
    addReaction,
    removeReaction,
    recallMessage,
  };
}
