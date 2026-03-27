# netApp

A production-ready React + TypeScript starter template built with modern best practices and a scalable architecture.

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 |
| Language | TypeScript |
| Build | Vite |
| Routing | TanStack Router |
| Global state | Zustand v5 |
| Server state | TanStack Query v5 |
| HTTP client | Axios |
| Styling | Tailwind CSS, CSS Modules |
| Code quality | ESLint + Prettier |
| i18n | react-i18next |

## Project Structure

```
src/
├── assets/                  # Static assets (images, fonts, etc.)
├── components/
│   ├── layout/              # Page layouts (Header, Footer, Navbar, MainLayout, AuthLayout)
│   └── ui/                  # Reusable UI primitives (Button, TextField, Modal, Tabs, etc.)
├── hooks/
│   └── useAuth.ts           # Login, logout, and session-restore logic
├── pages/
│   ├── HomePage.tsx         # Protected dashboard — fetches /users via useQuery
│   └── LoginPage.tsx        # Login form — uses useAuth
├── routes/
│   ├── index.tsx            # Route definitions with lazy loading
│   └── ProtectedRoute.tsx   # Auth guard; redirects to /login when unauthenticated
├── services/
│   ├── apiClient.ts         # Axios instance with auth header & 401 auto-redirect
│   └── authService.ts       # login / logout / me API calls
├── store/
│   └── userStore.ts         # Zustand store (persisted to localStorage + devtools)
├── types/
│   └── index.ts             # Shared TypeScript interfaces and types
├── i18n/
│   ├── index.ts             # i18next configuration
│   └── locales/
│       ├── en.json          # English translations
│       └── vi.json          # Vietnamese translations
└── utils/
    └── storage.ts           # localStorage token helpers
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and set `VITE_API_BASE_URL` to your backend URL:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### Run

```bash
npm run dev        # development server → http://localhost:5173
npm run build      # production build
npm run preview    # preview production build locally
npm run lint       # run ESLint
```

## Architecture

### Auth flow

1. User submits the login form → `useAuth.login()` calls `POST /auth/login`
2. Response token is stored in `localStorage` and Zustand `userStore`
3. On any subsequent page load, `useAuth` detects the token and calls `GET /auth/me` to rehydrate the user
4. The Axios interceptor attaches `Authorization: Bearer <token>` to every request
5. On a `401` response the interceptor clears the token and redirects to `/login`

### State management

- **Zustand** (`userStore`) owns authentication state (user object, token, `isAuthenticated`). The store is persisted via `zustand/middleware/persist` so it survives page refreshes.
- **TanStack Query** owns all server state (lists, detail views, mutations). It handles caching, background refetching, and loading/error states.

### Routing

Routes are defined in `src/routes/index.tsx` using TanStack Router's code-based API (`createRoute` / `createRouter`). Page components are lazily loaded via `lazyRouteComponent`. Private routes are wrapped with `ProtectedRoute`.

```
/           → HomePage    (protected)
/login      → LoginPage   (public)
```

## Usage Examples

### Fetch data with TanStack Query

```ts
// services/userService.ts
import { apiClient } from "./apiClient";
import type { User } from "../types";

export const userService = {
  list: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>("/users");
    return data;
  },
};

// hooks/useUsers.ts
import { useQuery } from "@tanstack/react-query";
import { userService } from "../services/userService";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: userService.list,
  });
}

// pages/SomePage.tsx
const { data: users, isLoading, isError } = useUsers();
```

### Mutate data with TanStack Query

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/userService";

function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
```

### Add a new protected page

1. Create the page component in `src/pages/`.
2. Add a lazy import and a route entry inside the `ProtectedRoute` children array in `src/routes/index.tsx`.

```ts
import { createRoute, lazyRouteComponent } from "@tanstack/react-router";

const profileRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/profile",
  component: lazyRouteComponent(() => import("@/pages/ProfilePage")),
});

// Add to the route tree inside mainLayoutRoute.addChildren([...])
```

### Add a new Zustand store

```ts
// src/store/themeStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  dark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: false,
      toggle: () => set((s) => ({ dark: !s.dark })),
    }),
    { name: "theme-store" },
  ),
);
```

### Internationalization (i18n)

The app supports multiple languages via `react-i18next`. Currently available: English (`en`) and Vietnamese (`vi`). The selected language is persisted in `localStorage`.

To add a new language:

1. Create `src/i18n/locales/{code}.json` with the same translation keys
2. Register the resource in `src/i18n/index.ts`
3. Add the language option in `LanguageSwitcher.tsx`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Base URL for all API requests |

All variables must be prefixed with `VITE_` to be exposed to the browser bundle.
