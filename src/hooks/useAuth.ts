import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthTokenResponse, LoginRequest } from "@/types";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";
import { useUserStore } from "@/store/userStore";
import { storage } from "@/utils/storage";
import { useNavigate } from "@tanstack/react-router";

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser, clearUser } = useUserStore();

  // ─── Login ────────────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: async (tokenData: AuthTokenResponse) => {
      storage.setToken(tokenData.access_token);
      storage.setRefreshToken(tokenData.refresh_token);
      storage.setUserId(tokenData.id);
      const userData = await userService.getById(tokenData.id);
      setUser(userData);
    },
  });

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      storage.clear();
      clearUser();
      queryClient.clear();
      void navigate({ to: "/login", replace: true });
    },
  });

  // ─── Restore session on hard refresh ──────────────────────────────────────
  const userId = storage.getUserId();

  const { isLoading: isFetchingUser } = useQuery({
    queryKey: ["auth", "session", userId],
    queryFn: async () => {
      const ok = await authService.getSession();
      if (!ok || !userId) {
        storage.clear();
        clearUser();
        return null;
      }
      const userData = await userService.getById(userId);
      setUser(userData);
      return userData;
    },
    enabled: !!storage.getToken() && !isAuthenticated,
    retry: false,
    staleTime: Infinity,
  });

  return {
    user,
    isAuthenticated,
    isFetchingUser,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}
