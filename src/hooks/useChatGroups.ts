import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";
import type { CreateGroupRequest, AddMemberRequest } from "@/types";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const chatKeys = {
  groups: () => ["chat", "groups"] as const,
  groupDetail: (id: number) => ["chat", "groups", id] as const,
  messages: (groupId: number) => ["chat", "messages", groupId] as const,
};

// ─── Groups ───────────────────────────────────────────────────────────────────

type UseMyGroupsOptions = {
  /** Mặc định true. Đặt false khi chưa đăng nhập. Bật từ layout để prefetch nhóm → subscribe WS `/topic/chat/{id}`. */
  enabled?: boolean;
};

export function useMyGroups(options?: UseMyGroupsOptions) {
  return useQuery({
    queryKey: chatKeys.groups(),
    queryFn: chatService.getMyGroups,
    // Refetch periodically so new DM groups from other users appear without F5
    refetchInterval: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useGroupDetail(groupId: number | null) {
  return useQuery({
    queryKey: chatKeys.groupDetail(groupId!),
    queryFn: () => chatService.getGroupDetail(groupId!),
    enabled: groupId !== null,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateGroupRequest) => chatService.createGroup(req),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.groups() });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: number) => chatService.deleteGroup(groupId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.groups() });
    },
  });
}

export function useOpenDirectMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: number) => chatService.openDirectMessage(targetUserId),
    onSuccess: (newGroup) => {
      // Immediately insert into cache so sidebar updates without waiting for a refetch
      qc.setQueryData<typeof newGroup[]>(chatKeys.groups(), (prev) => {
        if (!prev) return [newGroup];
        if (prev.some((g) => g.id === newGroup.id)) return prev;
        return [newGroup, ...prev];
      });
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: number) => chatService.leaveGroup(groupId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.groups() });
    },
  });
}

// ─── Members ──────────────────────────────────────────────────────────────────

export function useAddMember(groupId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: AddMemberRequest) => chatService.addMember(groupId, req),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.groupDetail(groupId) });
      void qc.invalidateQueries({ queryKey: chatKeys.groups() });
    },
  });
}

export function useRemoveMember(groupId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => chatService.removeMember(groupId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.groupDetail(groupId) });
      void qc.invalidateQueries({ queryKey: chatKeys.groups() });
    },
  });
}

export function useMakeAdmin(groupId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => chatService.makeAdmin(groupId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.groupDetail(groupId) });
    },
  });
}
