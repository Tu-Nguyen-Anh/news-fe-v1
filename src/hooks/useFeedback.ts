import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feedbackService } from "@/services/feedbackService";

export const feedbackKeys = {
  all: () => ["feedbacks"] as const,
  my: (page: number, size: number) => ["feedbacks", "my", page, size] as const,
  admin: (status: number | undefined, page: number, size: number) =>
    ["feedbacks", "admin", status, page, size] as const,
};

export function useMyFeedbacks(page = 0, size = 10) {
  return useQuery({
    queryKey: feedbackKeys.my(page, size),
    queryFn: () => feedbackService.getMyFeedbacks(page, size),
  });
}

export function useCreateFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: feedbackService.create,
    onSuccess: () => void qc.invalidateQueries({ queryKey: feedbackKeys.all() }),
  });
}

export function useDeleteFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: feedbackService.deleteFeedback,
    onSuccess: () => void qc.invalidateQueries({ queryKey: feedbackKeys.all() }),
  });
}

export function useAdminFeedbacks(status: number | undefined, page = 0, size = 10) {
  return useQuery({
    queryKey: feedbackKeys.admin(status, page, size),
    queryFn: () => feedbackService.adminGetAll(status, page, size),
  });
}

export function useAdminUpdateFeedbackStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) =>
      feedbackService.adminUpdateStatus(id, status),
    onSuccess: () => void qc.invalidateQueries({ queryKey: feedbackKeys.all() }),
  });
}
