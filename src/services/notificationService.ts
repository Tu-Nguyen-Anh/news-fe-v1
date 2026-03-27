import type { Notification, PageResponse, UnreadCountResponse } from "@/types";
import { apiClient } from "./apiClient";

export const notificationService = {
  getNotifications: async (page = 0, size = 20): Promise<PageResponse<Notification>> => {
    const { data } = await apiClient.get<{ data: PageResponse<Notification> }>("/notifications", {
      params: { page, size },
    });
    return data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<{ data: UnreadCountResponse }>("/notifications/unread-count");
    return data.data.unread_count;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch("/notifications/read-all");
  },
};
