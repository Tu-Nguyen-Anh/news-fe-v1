import type {
  Article,
  ArticleRequest,
  ArticleFilterRequest,
  PageResponse,
  FavoriteArticle,
  ArticleViewHistory,
} from "@/types";
import { apiClient } from "./apiClient";
import { decodeEntities } from "@/utils/articleDisplay";

const decodeTitle = <T extends { title: string }>(item: T): T => ({
  ...item,
  title: decodeEntities(item.title),
});

export const articleService = {
  filter: async (req: ArticleFilterRequest): Promise<PageResponse<Article>> => {
    const { data } = await apiClient.post<{ data: PageResponse<Article> }>("/articles/filter", req);
    return { ...data.data, content: data.data.content.map(decodeTitle) };
  },

  getById: async (id: number): Promise<Article> => {
    const { data } = await apiClient.get<{ data: Article }>(`/articles/${id}`);
    return decodeTitle(data.data);
  },

  create: async (req: ArticleRequest): Promise<Article> => {
    const { data } = await apiClient.post<{ data: Article }>("/articles", req);
    return data.data;
  },

  update: async (id: number, req: ArticleRequest): Promise<Article> => {
    const { data } = await apiClient.put<{ data: Article }>(`/articles/${id}`, req);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/articles/${id}`);
  },

  checkLink: async (link: string): Promise<boolean> => {
    try {
      await apiClient.get("/articles/exist-link", { params: { link } });
      return false;
    } catch {
      return true;
    }
  },

  addFavorite: async (articleId: number): Promise<void> => {
    await apiClient.post(`/articles/${articleId}/favorites`);
  },

  removeFavorite: async (articleId: number): Promise<void> => {
    await apiClient.delete(`/articles/${articleId}/favorites`);
  },

  getFavorites: async (page = 0, size = 10): Promise<PageResponse<FavoriteArticle>> => {
    const { data } = await apiClient.get<{ data: PageResponse<FavoriteArticle> }>("/articles/favorites", {
      params: { page, size },
    });
    return { ...data.data, content: data.data.content.map(decodeTitle) };
  },

  recordView: async (articleId: number): Promise<void> => {
    await apiClient.post(`/articles/${articleId}/view`);
  },

  getViewHistory: async (page = 0, size = 10): Promise<PageResponse<ArticleViewHistory>> => {
    const { data } = await apiClient.get<{ data: PageResponse<ArticleViewHistory> }>("/articles/view-history", {
      params: { page, size },
    });
    return { ...data.data, content: data.data.content.map(decodeTitle) };
  },
};
