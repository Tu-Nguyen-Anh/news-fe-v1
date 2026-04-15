import type { User } from "@/types";

export const isAdminRole = (user: User | null | undefined): boolean =>
  user?.role === "ADMIN";

export const isAuthorRole = (user: User | null | undefined): boolean =>
  user?.role === "AUTHOR";

/** ADMIN + AUTHOR có thể tạo/sửa/xóa bài báo */
export const canManageArticles = (user: User | null | undefined): boolean =>
  user?.role === "ADMIN" || user?.role === "AUTHOR";

/** Chỉ ADMIN mới quản lý users, sources, topics, dashboard, admin feedback */
export const canManageUsers = (user: User | null | undefined): boolean =>
  user?.role === "ADMIN";

export const canManageSources = (user: User | null | undefined): boolean =>
  user?.role === "ADMIN";

export const canManageTopics = (user: User | null | undefined): boolean =>
  user?.role === "ADMIN";
