import type { Feedback, FeedbackListResponse, FeedbackRequest, PageResponse } from "@/types";
import { apiClient } from "./apiClient";

// Backend có thể trả về { items, total } (theo docs) hoặc { content, amount } (Spring chuẩn).
// Hàm này chuẩn hoá cả hai format về FeedbackListResponse.
function normalizePage(raw: (PageResponse<Feedback> & { items?: Feedback[]; total?: number }) | null | undefined): FeedbackListResponse {
  const rawItems = raw?.items ?? raw?.content ?? [];
  const items = rawItems.map((f) => ({ ...f, images: f.images ?? [] }));
  const total = raw?.total ?? raw?.amount ?? 0;
  return { items, total };
}

export const feedbackService = {
  // ── User endpoints ─────────────────────────────────────────────────────────

  create: async (req: FeedbackRequest): Promise<Feedback> => {
    const { data } = await apiClient.post<{ data: Feedback }>("/feedbacks", req);
    return { ...data.data, images: data.data?.images ?? [] };
  },

  getMyFeedbacks: async (page = 0, size = 10): Promise<FeedbackListResponse> => {
    const { data } = await apiClient.get<{ data: PageResponse<Feedback> & { items?: Feedback[]; total?: number } }>("/feedbacks", {
      params: { page, size },
    });
    return normalizePage(data.data);
  },

  getFeedback: async (id: number): Promise<Feedback> => {
    const { data } = await apiClient.get<{ data: Feedback }>(`/feedbacks/${id}`);
    return data.data;
  },

  deleteFeedback: async (id: number): Promise<void> => {
    await apiClient.delete(`/feedbacks/${id}`);
  },

  // ── Admin endpoints ────────────────────────────────────────────────────────

  adminGetAll: async (
    status?: number,
    page = 0,
    size = 10,
  ): Promise<FeedbackListResponse> => {
    const { data } = await apiClient.get<{ data: PageResponse<Feedback> & { items?: Feedback[]; total?: number } }>(
      "/admin/feedbacks",
      { params: { ...(status !== undefined ? { status } : {}), page, size } },
    );
    return normalizePage(data.data);
  },

  adminUpdateStatus: async (id: number, status: number): Promise<Feedback> => {
    const { data } = await apiClient.put<{ data: Feedback }>(
      `/admin/feedbacks/${id}/status`,
      { status },
    );
    return data.data;
  },
};
