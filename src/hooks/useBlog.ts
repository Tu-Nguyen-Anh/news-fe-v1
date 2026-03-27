import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { blogService } from "@/services/blogService";
import type { BlogCommentRequest, BlogPostRequest, BlogShareRequest } from "@/types";

// ─── Posts ────────────────────────────────────────────────────────────────────

export function useBlogFeed(keyword = "") {
  return useInfiniteQuery({
    queryKey: ["blog", "feed", keyword],
    queryFn: ({ pageParam = 0 }) =>
      blogService.filterPosts({ page: pageParam as number, size: 10, keyword: keyword || undefined }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.content.length, 0);
      return loaded < lastPage.amount ? allPages.length : undefined;
    },
    // Khi quay lại `/blog` (hoặc bấm menu tới `/blog`), luôn gọi lại API
    // để hiển thị bài mới nhất, tránh bị cache staleTime toàn cục.
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useUserBlogFeed(authorId: number) {
  return useInfiniteQuery({
    queryKey: ["blog", "user-feed", authorId],
    queryFn: ({ pageParam = 0 }) =>
      blogService.filterPosts({ page: pageParam as number, size: 12, author_id: authorId }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.content.length, 0);
      return loaded < lastPage.amount ? allPages.length : undefined;
    },
    enabled: authorId > 0,
  });
}

export function useBlogPost(id: number) {
  return useQuery({
    queryKey: ["blog", "post", id],
    queryFn: () => blogService.getPost(id),
    enabled: id > 0,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: BlogPostRequest) => blogService.createPost(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog", "feed"] }),
  });
}

export function useUpdatePost(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: BlogPostRequest) => blogService.updatePost(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog", "feed"] });
      qc.invalidateQueries({ queryKey: ["blog", "post", id] });
      qc.invalidateQueries({ queryKey: ["blog", "user-feed"] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => blogService.deletePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog"] }),
  });
}

export function useLikePost() {
  return useMutation({
    mutationFn: ({ id, liked }: { id: number; liked: boolean }) =>
      liked ? blogService.unlikePost(id) : blogService.likePost(id),
  });
}

export function useSharePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req?: BlogShareRequest }) =>
      blogService.sharePost(id, req),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["blog", "feed"] });
      qc.invalidateQueries({ queryKey: ["blog", "post", id] });
    },
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function useBlogComments(postId: number, page = 0) {
  return useQuery({
    queryKey: ["blog", "comments", postId, page],
    queryFn: () => blogService.getComments(postId, page, 10),
    enabled: postId > 0,
    refetchOnMount: "always",
  });
}

export function useBlogReplies(postId: number, commentId: number, enabled = false) {
  return useQuery({
    queryKey: ["blog", "replies", postId, commentId],
    queryFn: () => blogService.getReplies(postId, commentId, 0, 20),
    enabled,
    staleTime: 0,
    gcTime: 0, // discard cache when disabled so next expand always hits the API
  });
}

export function useAddBlogComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: BlogCommentRequest) => blogService.addComment(postId, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog", "comments", postId] });
      qc.invalidateQueries({ queryKey: ["blog", "post", postId] });
      qc.invalidateQueries({ queryKey: ["blog", "feed"] });
    },
  });
}

export function useDeleteBlogComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => blogService.deleteComment(postId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog", "comments", postId] });
      qc.invalidateQueries({ queryKey: ["blog", "replies", postId] });
      qc.invalidateQueries({ queryKey: ["blog", "post", postId] });
    },
  });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export function useBlogUserProfile(userId: number) {
  return useQuery({
    queryKey: ["blog", "profile", userId],
    queryFn: () => blogService.getUserProfile(userId, 0, 100),
    enabled: userId > 0,
  });
}
