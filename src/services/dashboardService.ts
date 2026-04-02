import { apiClient } from "./apiClient";

export interface MonthGrowthEntry {
  month: number;
  month_name: string;
  count: number;
}

export interface ArticleGrowthResponse {
  year: number;
  months: MonthGrowthEntry[];
  total: number;
}

export interface SourceMonthlyEntry {
  month: number;
  count: number;
}

export interface SourceArticleData {
  source_id: number;
  source_name: string;
  monthly_data: SourceMonthlyEntry[];
  total: number;
}

export interface ArticleBySourceResponse {
  year: number;
  sources: SourceArticleData[];
}

export interface DayEntry {
  day: number;
  count: number;
}

export interface ArticleDailyResponse {
  year: number;
  month: number;
  total_days: number;
  days: DayEntry[];
  total: number;
}

export const dashboardService = {
  getArticleGrowth: async (year?: number): Promise<ArticleGrowthResponse> => {
    const { data } = await apiClient.get<{ data: ArticleGrowthResponse }>(
      "/dashboard/articles/growth",
      { params: year ? { year } : {} },
    );
    return data.data;
  },

  getArticlesBySource: async (year?: number): Promise<ArticleBySourceResponse> => {
    const { data } = await apiClient.get<{ data: ArticleBySourceResponse }>(
      "/dashboard/articles/by-source",
      { params: year ? { year } : {} },
    );
    return data.data;
  },

  getArticleDaily: async (year?: number, month?: number): Promise<ArticleDailyResponse> => {
    const params: Record<string, number> = {};
    if (year) params.year = year;
    if (month) params.month = month;
    const { data } = await apiClient.get<{ data: ArticleDailyResponse }>(
      "/dashboard/articles/daily",
      { params },
    );
    return data.data;
  },
};
