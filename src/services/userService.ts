import type {
  User,
  UserRequest,
  UserFilterRequest,
  PageResponse,
  UserHistory,
  ChangePasswordRequest,
  MentionUser,
} from "@/types";
import { apiClient } from "./apiClient";

/** BE trả `phone`, FE dùng `phone_number` */
function normalizeUser(raw: Record<string, unknown>): User {
  const phone = raw.phone_number ?? raw.phone;
  return {
    id: raw.id as number,
    username: raw.username as string,
    full_name: raw.full_name as string,
    email: raw.email as string,
    phone_number: typeof phone === "string" && phone.length > 0 ? phone : null,
    avatar: (raw.avatar as string | null) ?? null,
    status: raw.status as number,
  };
}

export const userService = {
  filter: async (req: UserFilterRequest): Promise<PageResponse<User>> => {
    const { data } = await apiClient.post<{ data: PageResponse<Record<string, unknown>> }>(
      "/users/filter",
      req,
    );
    const d = data.data;
    return {
      ...d,
      content: d.content.map(normalizeUser),
    };
  },

  getById: async (id: number): Promise<User> => {
    const { data } = await apiClient.get<{ data: Record<string, unknown> }>(`/users/${id}`);
    return normalizeUser(data.data);
  },

  create: async (req: UserRequest): Promise<User> => {
    const { data } = await apiClient.post<{ data: Record<string, unknown> }>("/users", req);
    return normalizeUser(data.data);
  },

  update: async (id: number, req: UserRequest): Promise<User> => {
    const { data } = await apiClient.put<{ data: Record<string, unknown> }>(`/users/${id}`, req);
    return normalizeUser(data.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  resetPassword: async (id: number): Promise<void> => {
    await apiClient.put(`/users/reset-password/${id}`);
  },

  changePassword: async (id: number, req: ChangePasswordRequest): Promise<void> => {
    await apiClient.put(`/users/${id}/password`, req);
  },

  getHistories: async (id: number, page = 0, size = 10): Promise<PageResponse<UserHistory>> => {
    const { data } = await apiClient.get<{ data: PageResponse<UserHistory> }>(
      `/users/${id}/histories`,
      { params: { page, size } },
    );
    return data.data;
  },

  checkUsername: async (username: string): Promise<boolean> => {
    try {
      await apiClient.get("/users/check-username", { params: { username } });
      return false; // available
    } catch {
      return true; // taken
    }
  },

  checkEmail: async (email: string): Promise<boolean> => {
    try {
      await apiClient.get("/users/exist-email", { params: { email } });
      return false;
    } catch {
      return true;
    }
  },

  checkPhone: async (phone_number: string): Promise<boolean> => {
    try {
      await apiClient.get("/users/exist-phone", { params: { phone_number } });
      return false;
    } catch {
      return true;
    }
  },

  mentionSearch: async (keyword = "", page = 0, size = 6): Promise<PageResponse<MentionUser>> => {
    const { data } = await apiClient.get<{ data: PageResponse<MentionUser> }>("/users/mention-search", {
      params: { keyword, page, size },
    });
    return data.data;
  },

  // Legacy - kept for compatibility
  getUsers: async (): Promise<User[]> => {
    const { data } = await apiClient.post<{ data: PageResponse<Record<string, unknown>> }>(
      "/users/filter",
      { page: 0, size: 100 },
    );
    return data.data.content.map(normalizeUser);
  },
};
