import type { Source, SourceRequest, SourceFilterRequest, PageResponse, SourceWithTopics, SourceWithFollowTopics } from "@/types";
import { apiClient } from "./apiClient";

export const sourceService = {
  filter: async (req: SourceFilterRequest): Promise<PageResponse<Source>> => {
    const { data } = await apiClient.post<{ data: PageResponse<Source> }>("/sources/filter", req);
    return data.data;
  },

  getById: async (id: number): Promise<Source> => {
    const { data } = await apiClient.get<{ data: Source }>(`/sources/${id}`);
    return data.data;
  },

  create: async (req: SourceRequest): Promise<Source> => {
    const { data } = await apiClient.post<{ data: Source }>("/sources", req);
    return data.data;
  },

  update: async (id: number, req: SourceRequest): Promise<Source> => {
    const { data } = await apiClient.put<{ data: Source }>(`/sources/${id}`, req);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/sources/${id}`);
  },

  getAllWithTopics: async (): Promise<SourceWithTopics[]> => {
    const { data } = await apiClient.get<{ data: SourceWithTopics[] }>("/sources/all-with-topics");
    return data.data;
  },

  getAllWithFollowTopics: async (): Promise<SourceWithFollowTopics[]> => {
    const { data } = await apiClient.get<{ data: SourceWithFollowTopics[] }>("/sources/all-with-topics");
    return data.data;
  },

  checkName: async (name: string): Promise<boolean> => {
    try {
      await apiClient.get("/sources/exist-name", { params: { name } });
      return false;
    } catch {
      return true;
    }
  },

  checkUrl: async (url: string): Promise<boolean> => {
    try {
      await apiClient.get("/sources/exist-url", { params: { url } });
      return false;
    } catch {
      return true;
    }
  },
};
