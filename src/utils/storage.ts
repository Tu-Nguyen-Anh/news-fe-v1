const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_ID_KEY = "user_id";

export const storage = {
  getToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  setToken: (token: string): void => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  removeToken: (): void => localStorage.removeItem(ACCESS_TOKEN_KEY),

  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string): void => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  removeRefreshToken: (): void => localStorage.removeItem(REFRESH_TOKEN_KEY),

  getUserId: (): number | null => {
    const id = localStorage.getItem(USER_ID_KEY);
    return id ? parseInt(id, 10) : null;
  },
  setUserId: (id: number): void => localStorage.setItem(USER_ID_KEY, String(id)),
  removeUserId: (): void => localStorage.removeItem(USER_ID_KEY),

  clear: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  },
};
