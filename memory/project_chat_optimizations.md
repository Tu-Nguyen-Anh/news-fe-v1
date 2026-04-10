---
name: Chat Performance Optimizations
description: 6 chat UX optimizations implemented for seamless experience
type: project
---

Implemented 6 chat performance optimizations on the `code-server` branch.

**Files changed:**
- `src/services/chatCacheService.ts` (NEW) — IndexedDB cache service
- `src/components/chat/MessageSkeleton.tsx` (NEW) — Skeleton loading screen
- `src/types/index.ts` — Added `pending?: boolean` to `ChatMessage`
- `src/hooks/useChatMessages.ts` — Optimistic UI, O(1) dedup, IndexedDB integration
- `src/components/chat/ChatWindow.tsx` — Virtual scrolling with @tanstack/react-virtual
- `src/components/chat/MessageBubble.tsx` — Lazy loading images, pending indicator

**Why:** User requested seamless chat UX with: virtual scrolling (1), optimistic UI (2), scroll position preservation (3), WS deduplication (4), skeleton+lazy loading (5), IndexedDB offline cache (6).

**How to apply:** Reference these patterns when adding new chat features. The `chatCacheService` is non-critical (all failures silently ignored). Optimistic messages use negative IDs; they're matched back to real WS messages by content+sender.
