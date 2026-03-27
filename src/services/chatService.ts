import type {
  ChatGroup,
  ChatGroupDetail,
  ChatGroupMember,
  ChatMessagePage,
  CreateGroupRequest,
  AddMemberRequest,
  ReactionResponse,
  ReaderResponse,
} from "@/types";
import { apiClient } from "./apiClient";

export const chatService = {
  // ─── Groups ──────────────────────────────────────────────────────────────

  getMyGroups: async (): Promise<ChatGroup[]> => {
    const { data } = await apiClient.get<{ data: ChatGroup[] }>("/chat/groups");
    return data.data;
  },

  getGroupDetail: async (groupId: number): Promise<ChatGroupDetail> => {
    const { data } = await apiClient.get<{ data: ChatGroupDetail }>(`/chat/groups/${groupId}`);
    return data.data;
  },

  createGroup: async (req: CreateGroupRequest): Promise<ChatGroup> => {
    const { data } = await apiClient.post<{ data: ChatGroup }>("/chat/groups", req);
    return data.data;
  },

  openDirectMessage: async (targetUserId: number): Promise<ChatGroup> => {
    const { data } = await apiClient.post<{ data: ChatGroup }>(`/chat/groups/direct/${targetUserId}`);
    return data.data;
  },

  deleteGroup: async (groupId: number): Promise<void> => {
    await apiClient.delete(`/chat/groups/${groupId}`);
  },

  leaveGroup: async (groupId: number): Promise<void> => {
    await apiClient.delete(`/chat/groups/${groupId}/leave`);
  },

  // ─── Members ─────────────────────────────────────────────────────────────

  addMember: async (groupId: number, req: AddMemberRequest): Promise<ChatGroupMember> => {
    const { data } = await apiClient.post<{ data: ChatGroupMember }>(
      `/chat/groups/${groupId}/members`,
      req,
    );
    return data.data;
  },

  removeMember: async (groupId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/chat/groups/${groupId}/members/${userId}`);
  },

  makeAdmin: async (groupId: number, userId: number): Promise<void> => {
    await apiClient.put(`/chat/groups/${groupId}/members/${userId}/admin`);
  },

  // ─── Messages ────────────────────────────────────────────────────────────

  getMessages: async (groupId: number, page = 0, size = 30): Promise<ChatMessagePage> => {
    const { data } = await apiClient.get<{ data: ChatMessagePage }>(
      `/chat/groups/${groupId}/messages`,
      { params: { page, size } },
    );
    return data.data;
  },

  markAsRead: async (groupId: number): Promise<void> => {
    await apiClient.post(`/chat/groups/${groupId}/messages/read`);
  },

  // ─── Presence ────────────────────────────────────────────────────────────

  getPresence: async (groupId: number): Promise<ChatGroupMember[]> => {
    const { data } = await apiClient.get<{ data: ChatGroupMember[] }>(
      `/chat/groups/${groupId}/presence`,
    );
    return data.data;
  },

  // ─── Reactions ───────────────────────────────────────────────────────────

  addReaction: async (groupId: number, messageId: number, emoji: string): Promise<ReactionResponse[]> => {
    const { data } = await apiClient.post<{ data: ReactionResponse[] }>(
      `/chat/groups/${groupId}/messages/${messageId}/reactions`,
      { emoji },
    );
    return data.data;
  },

  removeReaction: async (groupId: number, messageId: number, emoji: string): Promise<ReactionResponse[]> => {
    const { data } = await apiClient.delete<{ data: ReactionResponse[] }>(
      `/chat/groups/${groupId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    );
    return data.data;
  },

  // ─── Recall ──────────────────────────────────────────────────────────────

  recallMessage: async (groupId: number, messageId: number): Promise<void> => {
    await apiClient.delete(`/chat/groups/${groupId}/messages/${messageId}/recall`);
  },

  // ─── Read receipts detail ─────────────────────────────────────────────────

  getMessageReads: async (groupId: number, messageId: number): Promise<ReaderResponse[]> => {
    const { data } = await apiClient.get<{ data: ReaderResponse[] }>(
      `/chat/groups/${groupId}/messages/${messageId}/reads`,
    );
    return data.data;
  },
};
