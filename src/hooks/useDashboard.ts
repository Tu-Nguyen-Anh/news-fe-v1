import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboardService";

export function useArticleGrowth(year?: number) {
  return useQuery({
    queryKey: ["dashboard", "article-growth", year ?? "current"],
    queryFn: () => dashboardService.getArticleGrowth(year),
  });
}

export function useArticlesBySource(year?: number) {
  return useQuery({
    queryKey: ["dashboard", "articles-by-source", year ?? "current"],
    queryFn: () => dashboardService.getArticlesBySource(year),
  });
}

export function useArticleDaily(year?: number, month?: number) {
  return useQuery({
    queryKey: ["dashboard", "article-daily", year ?? "current", month ?? "current"],
    queryFn: () => dashboardService.getArticleDaily(year, month),
  });
}
