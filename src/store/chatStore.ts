import { create } from "zustand";

interface ChatState {
  // unread counts per group (only groups where a new message arrived while not active)
  unreadByGroup: Record<number, number>;
  totalUnread: number;
  activeGroupId: number | null;
}

interface ChatActions {
  setActiveGroup: (groupId: number | null) => void;
  incrementUnread: (groupId: number) => void;
  clearGroupUnread: (groupId: number) => void;
  clearAll: () => void;
}

const initialState: ChatState = {
  unreadByGroup: {},
  totalUnread: 0,
  activeGroupId: null,
};

export const useChatStore = create<ChatState & ChatActions>()((set, get) => ({
  ...initialState,

  setActiveGroup: (groupId) => {
    set({ activeGroupId: groupId });
    if (groupId !== null) {
      const { unreadByGroup } = get();
      const count = unreadByGroup[groupId] ?? 0;
      if (count > 0) {
        const next = { ...unreadByGroup, [groupId]: 0 };
        const total = Object.values(next).reduce((s, v) => s + v, 0);
        set({ unreadByGroup: next, totalUnread: total });
      }
    }
  },

  incrementUnread: (groupId) => {
    const { unreadByGroup, activeGroupId } = get();
    if (activeGroupId === groupId) return; // currently viewing this group → no unread
    const next = { ...unreadByGroup, [groupId]: (unreadByGroup[groupId] ?? 0) + 1 };
    const total = Object.values(next).reduce((s, v) => s + v, 0);
    set({ unreadByGroup: next, totalUnread: total });
  },

  clearGroupUnread: (groupId) => {
    const { unreadByGroup } = get();
    if (!unreadByGroup[groupId]) return;
    const next = { ...unreadByGroup, [groupId]: 0 };
    const total = Object.values(next).reduce((s, v) => s + v, 0);
    set({ unreadByGroup: next, totalUnread: total });
  },

  clearAll: () => set({ ...initialState }),
}));
