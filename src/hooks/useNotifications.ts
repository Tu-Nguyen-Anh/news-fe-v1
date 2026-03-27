import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notificationService";

export function useNotifications(page = 0, size = 20) {
  return useQuery({
    queryKey: ["notifications", page, size],
    queryFn: () => notificationService.getNotifications(page, size),
    refetchOnMount: "always",
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationService.getUnreadCount(),
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
