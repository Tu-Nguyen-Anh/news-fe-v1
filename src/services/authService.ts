import type { AuthTokenResponse, LoginRequest, User } from "@/types";
import { apiClient } from "./apiClient";

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthTokenResponse> => {
    const { data } = await apiClient.post<{ data: AuthTokenResponse }>("/auth/login", credentials);
    return data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  refresh: async (refreshToken: string): Promise<AuthTokenResponse> => {
    const { data } = await apiClient.post<{ data: AuthTokenResponse }>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return data.data;
  },

  getSession: async (): Promise<boolean> => {
    try {
      await apiClient.get("/auth/get-session");
      return true;
    } catch {
      return false;
    }
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<{ data: User }>("/auth/get-session");
    return data.data;
  },
};
