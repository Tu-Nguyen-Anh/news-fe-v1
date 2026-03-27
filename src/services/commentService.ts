import type { Comment, CommentRequest, PageResponse } from "@/types";
import { apiClient } from "./apiClient";

export const commentService = {
  getComments: async (articleId: number, page = 0, size = 10): Promise<PageResponse<Comment>> => {
    const { data } = await apiClient.get<{ data: PageResponse<Comment> }>(
      `/articles/${articleId}/comments`,
      { params: { page, size } },
    );
    return data.data;
  },

  createComment: async (articleId: number, req: CommentRequest): Promise<Comment> => {
    const { data } = await apiClient.post<{ data: Comment }>(
      `/articles/${articleId}/comments`,
      req,
    );
    return data.data;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await apiClient.delete(`/articles/comments/${commentId}`);
  },
};
