/**
 * Chat messages hook.
 *
 * Optimizations implemented:
 *  2. Optimistic UI  — message appears instantly; temp entry replaced on WS confirm.
 *  4. WS Deduplication — O(1) Set lookup prevents duplicate messages.
 *  6. IndexedDB cache  — cache-first display; API data refreshes silently.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";
import { chatCacheService } from "@/services/chatCacheService";
import { storage } from "@/utils/storage";
import { useChatStore } from "@/store/chatStore";
import { useUserStore } from "@/store/userStore";
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
  const currentUser = useUserStore((s) => s.user);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<number, boolean>>({});

  const clientRef = useRef<Client | null>(null);
  const { clearGroupUnread } = useChatStore();

  // ── Criteria 4: O(1) deduplication via a Set of confirmed message IDs ────
  const seenIdsRef = useRef<Set<number>>(new Set());

  // ── Criteria 2: Pending optimistic messages (content → tempId map) ────────
  // Allows matching incoming WS messages back to the temp entry we added.
  const pendingRef = useRef<Map<string, number>>(new Map());

  // ── Reset and re-initialize when group changes ────────────────────────────
  useEffect(() => {
    if (groupId === null) {
      setMessages([]);
      setPage(0);
      setTotal(0);
      setOnlineUsers({});
      seenIdsRef.current.clear();
      pendingRef.current.clear();
      return;
    }

    const liveKey = [...chatKeys.messages(groupId), "live"];
    const liveMessages = qc.getQueryData<ChatMessage[]>(liveKey) ?? [];

    setMessages([]);
    setPage(0);
    setOnlineUsers({});
    seenIdsRef.current.clear();
    pendingRef.current.clear();
    setInitialLoading(true);

    // ── Criteria 6: Show IndexedDB cache immediately (cache-first) ────────
    chatCacheService.getMessages(groupId).then((cached) => {
      if (cached.length > 0) {
        cached.forEach((m) => seenIdsRef.current.add(m.id));
        const cachedIds = new Set(cached.map((m) => m.id));
        const liveMerge = liveMessages.filter((m) => !cachedIds.has(m.id));
        setMessages([...cached, ...liveMerge]);
        setInitialLoading(false); // render cache instantly; API will refresh below
      }
    });

    // ── Fetch from API (authoritative) in parallel with presence ─────────
    Promise.all([
      chatService.getMessages(groupId, 0, PAGE_SIZE),
      chatService.getPresence(groupId).catch(() => []),
    ])
      .then(([msgData, presenceData]) => {
        const historical = [...msgData.content].reverse(); // newest-first → oldest-first

        // Register in dedup set
        historical.forEach((m) => seenIdsRef.current.add(m.id));

        const historicalIds = new Set(historical.map((m) => m.id));
        const newLive = liveMessages.filter((m) => !historicalIds.has(m.id));
        setMessages([...historical, ...newLive]);
        setTotal(msgData.amount);
        setPage(1);
        clearGroupUnread(groupId);

        // Persist fresh batch to IndexedDB
        void chatCacheService.saveMessages(groupId, historical);

        // Build online map
        const onlineMap: Record<number, boolean> = {};
        (presenceData as Array<{ user_id: number; online?: boolean | null }>).forEach((m) => {
          if (m.online !== null && m.online !== undefined) {
            onlineMap[m.user_id] = m.online;
          }
        });
        setOnlineUsers(onlineMap);

        void chatService.markAsRead(groupId);
      })
      .finally(() => setInitialLoading(false));

    // ── Per-group STOMP client ────────────────────────────────────────────
    const token = storage.getToken();
    if (!token) return;

    clientRef.current?.deactivate();

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        // ── New messages ───────────────────────────────────────────────
        client.subscribe(`/topic/chat/${groupId}`, (frame) => {
          const msg: ChatMessage = JSON.parse(frame.body);

          // ── Criteria 4: Deduplication — skip if already seen ─────────
          if (seenIdsRef.current.has(msg.id)) return;
          seenIdsRef.current.add(msg.id);

          setMessages((prev) => {
            // ── Criteria 2: Resolve optimistic temp message ───────────
            // Read user ID directly from store to avoid stale closure.
            const myId = useUserStore.getState().user?.id;

            if (myId !== undefined && msg.sender_id === myId) {
              // Find the pending (optimistic) entry for this content in the
              // current state array — more reliable than the pendingRef map.
              const pendingIdx = prev.findIndex(
                (m) => m.pending === true && m.content === msg.content,
              );
              if (pendingIdx !== -1) {
                pendingRef.current.delete(msg.content);
                // Replace the temp entry in-place to preserve message order
                const next = [...prev];
                next[pendingIdx] = { ...msg, readers: [], reactions: [] };
                return next;
              }
            }

            return [...prev, { ...msg, readers: [], reactions: [] }];
          });

          // Keep live cache in QueryClient (for cross-group notification provider)
          qc.setQueryData<ChatMessage[]>(liveKey, (prev) => {
            if ((prev ?? []).some((m) => m.id === msg.id)) return prev ?? [];
            return [...(prev ?? []), msg];
          });

          // Persist to IndexedDB
          void chatCacheService.appendMessage(groupId, msg);

          void chatService.markAsRead(groupId);
        });

        // ── Read receipts ──────────────────────────────────────────────
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

        // ── Reactions ──────────────────────────────────────────────────
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
                ? {
                    ...m,
                    content: "Tin nhắn đã bị thu hồi",
                    recalled: true,
                    message_type: null,
                    reactions: [],
                    readers: [],
                  }
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

  // ── Load older messages (infinite scroll up) ──────────────────────────────
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
        fresh.forEach((m) => seenIdsRef.current.add(m.id));
        return [...fresh, ...prev];
      });
      setTotal(data.amount);
      setPage((p) => p + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [groupId, loadingMore, messages.length, total, page]);

  // ── Criteria 2: Send message with Optimistic UI ───────────────────────────
  const sendMessage = useCallback(
    (content: string, messageType: "TEXT" | "EMOJI" = "TEXT") => {
      const client = clientRef.current;
      if (!client?.connected || !groupId || !currentUser) return;

      // Immediately show a temporary (optimistic) message
      const tempId = -(Date.now()); // negative so it never collides with server IDs
      const tempMsg: ChatMessage = {
        id: tempId,
        group_id: groupId,
        sender_id: currentUser.id,
        sender_username: currentUser.username ?? "",
        sender_full_name: currentUser.full_name ?? currentUser.username ?? "",
        sender_avatar: currentUser.avatar ?? null,
        content,
        message_type: messageType,
        created_at: Date.now(),
        readers: [],
        reactions: [],
        pending: true,
      };

      // Track content → tempId so the WS handler can resolve it
      pendingRef.current.set(content, tempId);
      setMessages((prev) => [...prev, tempMsg]);

      // Publish to server
      client.publish({
        destination: `/app/chat/${groupId}`,
        body: JSON.stringify({ content, message_type: messageType }),
      });
    },
    [groupId, currentUser],
  );

  // ── Reactions ─────────────────────────────────────────────────────────────
  const addReaction = useCallback(
    async (messageId: number, emoji: string) => {
      if (!groupId) return;
      try {
        const reactions = await chatService.addReaction(groupId, messageId, emoji);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
        );
      } catch {
        // WS reaction event will reconcile state
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

  // ── Recall message ─────────────────────────────────────────────────────────
  const recallMessage = useCallback(
    async (messageId: number) => {
      if (!groupId) return;
      await chatService.recallMessage(groupId, messageId);
      // Optimistic update (WS event also fires but may be slower)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                content: "Tin nhắn đã bị thu hồi",
                recalled: true,
                message_type: null,
                reactions: [],
                readers: [],
              }
            : m,
        ),
      );
    },
    [groupId],
  );

  const hasMore = total > messages.filter((m) => !m.pending).length;

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
