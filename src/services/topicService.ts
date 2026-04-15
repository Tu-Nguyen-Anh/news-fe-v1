import type { Topic, TopicRequest, TopicFilterRequest, PageResponse } from "@/types";
import { apiClient } from "./apiClient";

export interface FollowingTopicItem {
  id: number;
  topic_id: number;
  topic_name: string;
  topic_url: string;
  rss_url: string | null;
  source_id: number;
  source_name: string;
  followed_at: number;
}

type TopicMutationPayload = TopicRequest & {
  sourceId: number;
};

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
    const payload: TopicMutationPayload = {
      ...req,
      sourceId: req.source_id,
    };
    const { data } = await apiClient.post<{ data: Topic }>("/topics", payload);
    return data.data;
  },

  update: async (id: number, req: TopicRequest): Promise<Topic> => {
    const payload: TopicMutationPayload = {
      ...req,
      sourceId: req.source_id,
    };
    const { data } = await apiClient.put<{ data: Topic }>(`/topics/${id}`, payload);
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

  follow: async (topicId: number): Promise<void> => {
    await apiClient.post(`/topics/${topicId}/follow`);
  },

  unfollow: async (topicId: number): Promise<void> => {
    await apiClient.delete(`/topics/${topicId}/follow`);
  },

  getFollowing: async (page = 0, size = 100): Promise<{ data: FollowingTopicItem[]; total: number }> => {
    const { data } = await apiClient.get<{ data: { data: FollowingTopicItem[]; total: number } }>(
      "/topics/following",
      { params: { page, size } },
    );
    return data.data;
  },
};
