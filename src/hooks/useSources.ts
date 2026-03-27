import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sourceService } from "@/services/sourceService";
import type { SourceFilterRequest, SourceRequest } from "@/types";

export function useSourceFilter(req: SourceFilterRequest) {
  return useQuery({
    queryKey: ["sources", "filter", req],
    queryFn: () => sourceService.filter(req),
    refetchOnMount: "always",
  });
}

export function useSourceDetail(id: number) {
  return useQuery({
    queryKey: ["sources", id],
    queryFn: () => sourceService.getById(id),
    enabled: !!id,
    refetchOnMount: "always",
  });
}

export function useSourcesWithTopics() {
  return useQuery({
    queryKey: ["sources", "all-with-topics"],
    queryFn: sourceService.getAllWithTopics,
    refetchOnMount: "always",
  });
}

export function useCreateSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: SourceRequest) => sourceService.create(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });
}

export function useUpdateSource(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: SourceRequest) => sourceService.update(id, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });
}

export function useDeleteSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sourceService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });
}
