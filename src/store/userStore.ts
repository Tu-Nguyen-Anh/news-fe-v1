import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { User } from "@/types";

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
}

interface UserActions {
  setUser: (user: User) => void;
  clearUser: () => void;
}

type UserStore = UserState & UserActions;

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
};

export const useUserStore = create<UserStore>()(
  devtools(
    (set) => ({
      ...initialState,
      setUser: (user: User) => set({ user, isAuthenticated: true }, false, "setUser"),
      clearUser: () => set({ ...initialState }, false, "clearUser"),
    }),
    { name: "UserStore" },
  ),
);
