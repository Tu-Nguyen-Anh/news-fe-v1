import axios from "axios";
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { storage } from "@/utils/storage";
import { useUserStore } from "@/store/userStore";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://api.example.com";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor: attach auth token ───────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response interceptor: handle 401 by clearing auth state ──────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      storage.removeToken();
      useUserStore.getState().clearUser();
      // ProtectedRoute will handle the redirect to /login within React's lifecycle
    }
    return Promise.reject(error);
  },
);
