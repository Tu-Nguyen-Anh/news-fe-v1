import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import type { UserFilterRequest, UserRequest, ChangePasswordRequest } from "@/types";

export function useUserFilter(req: UserFilterRequest) {
  return useQuery({
    queryKey: ["users", "filter", req],
    queryFn: () => userService.filter(req),
    // Global staleTime 5 phút khiến quay lại trang không fetch — luôn refetch khi vào danh sách
    refetchOnMount: "always",
  });
}

export function useUserDetail(id: number) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => userService.getById(id),
    enabled: !!id,
    refetchOnMount: "always",
  });
}

export function useUserHistories(id: number, page: number, size: number) {
  return useQuery({
    queryKey: ["users", id, "histories", page, size],
    queryFn: () => userService.getHistories(id, page, size),
    enabled: !!id,
    refetchOnMount: "always",
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: UserRequest) => userService.create(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: UserRequest) => userService.update(id, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: number) => userService.resetPassword(id),
  });
}

export function useChangePassword(id: number) {
  return useMutation({
    mutationFn: (req: ChangePasswordRequest) => userService.changePassword(id, req),
  });
}

// Legacy export
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: userService.getUsers,
    refetchOnMount: "always",
  });
}
