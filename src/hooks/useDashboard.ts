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

export function useArticlesByTopic(year?: number) {
  return useQuery({
    queryKey: ["dashboard", "articles-by-topic", year ?? "current"],
    queryFn: () => dashboardService.getArticlesByTopic(year),
  });
}

export function useArticlesByTopicDaily(year?: number, month?: number, topicId?: number) {
  return useQuery({
    queryKey: ["dashboard", "articles-by-topic-daily", year ?? "current", month ?? "current", topicId ?? "all"],
    queryFn: () => dashboardService.getArticlesByTopicDaily(year, month, topicId),
  });
}
