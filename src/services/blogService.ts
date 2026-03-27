import type {
  BlogPost,
  BlogPostRequest,
  BlogPostFilterRequest,
  BlogComment,
  BlogCommentRequest,
  BlogShareRequest,
  BlogUserProfile,
  PageResponse,
} from "@/types";
import { apiClient } from "./apiClient";

export const blogService = {
  createPost: async (req: BlogPostRequest): Promise<BlogPost> => {
    const { data } = await apiClient.post<{ data: BlogPost }>("/posts", req);
    return data.data;
  },

  updatePost: async (id: number, req: BlogPostRequest): Promise<BlogPost> => {
    const { data } = await apiClient.put<{ data: BlogPost }>(`/posts/${id}`, req);
    return data.data;
  },

  deletePost: async (id: number): Promise<void> => {
    await apiClient.delete(`/posts/${id}`);
  },

  getPost: async (id: number): Promise<BlogPost> => {
    const { data } = await apiClient.get<{ data: BlogPost }>(`/posts/${id}`);
    return data.data;
  },

  filterPosts: async (req: BlogPostFilterRequest): Promise<PageResponse<BlogPost>> => {
    const { data } = await apiClient.post<{ data: PageResponse<BlogPost> }>("/posts/filter", req);
    return data.data;
  },

  likePost: async (id: number): Promise<void> => {
    await apiClient.post(`/posts/${id}/like`);
  },

  unlikePost: async (id: number): Promise<void> => {
    await apiClient.delete(`/posts/${id}/like`);
  },

  sharePost: async (id: number, req?: BlogShareRequest): Promise<void> => {
    await apiClient.post(`/posts/${id}/share`, req ?? {});
  },

  getComments: async (postId: number, page = 0, size = 10): Promise<PageResponse<BlogComment>> => {
    const { data } = await apiClient.get<{ data: PageResponse<BlogComment> }>(
      `/posts/${postId}/comments`,
      { params: { page, size } },
    );
    return data.data;
  },

  getReplies: async (postId: number, commentId: number, page = 0, size = 10): Promise<PageResponse<BlogComment>> => {
    const { data } = await apiClient.get<{ data: PageResponse<BlogComment> }>(
      `/posts/${postId}/comments/${commentId}/replies`,
      { params: { page, size } },
    );
    return data.data;
  },

  addComment: async (postId: number, req: BlogCommentRequest): Promise<BlogComment> => {
    const { data } = await apiClient.post<{ data: BlogComment }>(`/posts/${postId}/comments`, req);
    return data.data;
  },

  deleteComment: async (postId: number, commentId: number): Promise<void> => {
    await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
  },

  getUserProfile: async (userId: number, page = 0, size = 9): Promise<BlogUserProfile> => {
    const { data } = await apiClient.get<{ data: BlogUserProfile }>(
      `/posts/profile/${userId}`,
      { params: { page, size } },
    );
    return data.data;
  },
};
