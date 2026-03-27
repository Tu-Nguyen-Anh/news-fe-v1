import type { Topic, TopicRequest, TopicFilterRequest, PageResponse } from "@/types";
import { apiClient } from "./apiClient";

export const topicService = {
  filter: async (req: TopicFilterRequest): Promise<PageResponse<Topic>> => {
    const { data } = await apiClient.post<{ data: PageResponse<Topic> }>("/topics/filter", req);
    return data.data;
  },

  getById: async (id: number): Promise<Topic> => {
    const { data } = await apiClient.get<{ data: Topic }>(`/topics/${id}`);
    return data.data;
  },

  create: async (req: TopicRequest): Promise<Topic> => {
    const { data } = await apiClient.post<{ data: Topic }>("/topics", req);
    return data.data;
  },

  update: async (id: number, req: TopicRequest): Promise<Topic> => {
    const { data } = await apiClient.put<{ data: Topic }>(`/topics/${id}`, req);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/topics/${id}`);
  },

  checkName: async (name: string): Promise<boolean> => {
    try {
      await apiClient.get("/topics/exist-name", { params: { name } });
      return false;
    } catch {
      return true;
    }
  },

  checkUrl: async (url: string): Promise<boolean> => {
    try {
      await apiClient.get("/topics/exist-url", { params: { url } });
      return false;
    } catch {
      return true;
    }
  },
};
