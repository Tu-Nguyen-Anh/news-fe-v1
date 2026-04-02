import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { articleService } from "@/services/articleService";
import type { ArticleFilterRequest, ArticleRequest } from "@/types";

export function useArticleFilter(req: ArticleFilterRequest) {
  return useQuery({
    queryKey: ["articles", "filter", req],
    queryFn: () => articleService.filter(req),
  });
}

export function useArticleFilterInfinite(
  filters: Omit<ArticleFilterRequest, "page" | "size">,
  pageSize: number,
) {
  return useInfiniteQuery({
    queryKey: ["articles", "filter", "infinite", filters, pageSize],
    queryFn: ({ pageParam }) =>
      articleService.filter({ ...filters, page: pageParam as number, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.content.length, 0);
      if (loaded >= lastPage.amount) return undefined;
      if (lastPage.content.length === 0) return undefined;
      return allPages.length;
    },
    // Keep old results visible while new filter query is fetching → no skeleton flash
    placeholderData: keepPreviousData,
    // Don't refetch for 2 minutes (navigating away + back won't re-fetch)
    staleTime: 2 * 60 * 1000,
  });
}

export function useArticleDetail(id: number) {
  const numericId = Number(id);
  return useQuery({
    queryKey: ["articles", numericId],
    queryFn: () => articleService.getById(numericId),
    enabled: Number.isFinite(numericId) && numericId > 0,
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ArticleRequest) => articleService.create(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }),
  });
}

export function useUpdateArticle(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ArticleRequest) => articleService.update(id, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }),
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => articleService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }),
  });
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export function useFavorites(page = 0, size = 10) {
  return useQuery({
    queryKey: ["articles", "favorites", page, size],
    queryFn: () => articleService.getFavorites(page, size),
  });
}

export function useFavoriteStatus(articleId: number) {
  return useQuery({
    queryKey: ["articles", "favorites", "status", articleId],
    queryFn: async () => {
      const result = await articleService.getFavorites(0, 100);
      return result.content.some((f) => f.article_id === articleId);
    },
    enabled: articleId > 0,
  });
}

export function useFavoriteIds(size = 100) {
  return useQuery({
    queryKey: ["articles", "favorites", "ids", size],
    queryFn: async () => {
      const result = await articleService.getFavorites(0, size);
      return new Set(result.content.map((f) => f.article_id));
    },
  });
}

export function useAddFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (articleId: number) => articleService.addFavorite(articleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles", "favorites"] }),
  });
}

export function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (articleId: number) => articleService.removeFavorite(articleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles", "favorites"] }),
  });
}

// ─── View History ─────────────────────────────────────────────────────────────

export function useRecordView() {
  return useMutation({
    mutationFn: (articleId: number) => articleService.recordView(articleId),
  });
}

export function useViewHistory(page = 0, size = 10) {
  return useQuery({
    queryKey: ["articles", "view-history", page, size],
    queryFn: () => articleService.getViewHistory(page, size),
    refetchOnMount: "always",
  });
}
