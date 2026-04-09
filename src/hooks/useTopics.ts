import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { topicService } from "@/services/topicService";
import type { TopicFilterRequest, TopicRequest } from "@/types";

export function useTopicFilter(req: TopicFilterRequest) {
  return useQuery({
    queryKey: ["topics", "filter", req],
    queryFn: () => topicService.filter(req),
    refetchOnMount: "always",
  });
}

export function useTopicDetail(id: number) {
  return useQuery({
    queryKey: ["topics", id],
    queryFn: () => topicService.getById(id),
    enabled: !!id,
    refetchOnMount: "always",
  });
}

export function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: TopicRequest) => topicService.create(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topics"] }),
  });
}

export function useUpdateTopic(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: TopicRequest) => topicService.update(id, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topics"] }),
  });
}

export function useDeleteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => topicService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topics"] }),
  });
}

export function useFollowTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topicId: number) => topicService.follow(topicId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources", "all-with-follow-topics"] }),
  });
}

export function useUnfollowTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topicId: number) => topicService.unfollow(topicId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources", "all-with-follow-topics"] }),
  });
}
