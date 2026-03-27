import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentService } from "@/services/commentService";
import type { CommentRequest } from "@/types";

export function useComments(articleId: number, page = 0, size = 10) {
  return useQuery({
    queryKey: ["comments", articleId, page, size],
    queryFn: () => commentService.getComments(articleId, page, size),
    enabled: articleId > 0,
    refetchOnMount: "always",
  });
}

export function useCreateComment(articleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CommentRequest) => commentService.createComment(articleId, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", articleId] }),
  });
}

export function useDeleteComment(articleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => commentService.deleteComment(commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", articleId] }),
  });
}
