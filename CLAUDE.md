# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Vite dev server
npm run build            # TypeScript check + Vite production build
npm run preview          # Preview production build
npm run lint             # Lint src/ with ESLint
npm run lint:fix         # Lint and auto-fix
npm run format           # Format all files with Prettier
npm run format:check     # Check formatting without writing
```

No test framework is configured.

## Architecture

React 19 + TypeScript SPA built with Vite. Authentication-first app with protected routes and a REST API backend.

**Tech stack**: React 19, TypeScript (strict), Vite, TanStack Router (code-based routing), Zustand (auth state, persisted to localStorage), TanStack Query (server state), Axios, Tailwind CSS.

**Path alias**: `@/` maps to `src/`.

### Key layers

- **`services/apiClient.ts`** — Centralized Axios instance. Request interceptor adds Bearer token; response interceptor handles 401 by clearing auth and redirecting to `/login`. Base URL from `VITE_API_BASE_URL` env var.
- **`services/authService.ts`** — Auth API calls (`POST /auth/login`, `POST /auth/logout`, `GET /auth/me`).
- **`services/userService.ts`** — User API calls (pure service, no React hooks). Hooks that consume services live in `hooks/`.
- **`store/userStore.ts`** — Zustand store for user and isAuthenticated. Uses `devtools` middleware.
- **`hooks/useAuth.ts`** — Login/logout mutations and user restoration on page reload via `GET /auth/me`.
- **`hooks/useUsers.ts`** — TanStack Query hook wrapping `userService`. Pattern: service files export API functions, hook files consume them.
- **`routes/ProtectedRoute.tsx`** — Auth guard that redirects unauthenticated users to `/login`.
- **`routes/index.tsx`** — Route tree and router created with `createRoute`/`createRouter`. Code splitting via `lazyRouteComponent`. Type-safe routing via `Register` module declaration.
- **`components/RouteErrorFallback.tsx`** — Route-level error UI receiving `ErrorComponentProps` from TanStack Router. Used as `defaultErrorComponent` on the router.
- **`components/ErrorBoundary.tsx`** — Class-based React error boundary for render errors. Wraps `<App />` in `main.tsx`.
- **`types/index.ts`** — Shared interfaces: `User`, `LoginCredentials`, `AuthResponse`, `ApiError`, `PaginatedResponse<T>`.

### Auth flow

Login → token stored in localStorage + Zustand → Axios interceptor attaches token → 401 triggers automatic logout + redirect.

## Code Style

- **ESLint**: Flat config with TypeScript, React Hooks, React Refresh, Prettier integration.
- **Prettier**: Double quotes, semicolons, trailing commas (`all`), 100 char width.
- `console.log` is disallowed (warn/error only). Unused vars must be prefixed with `_`.
- Use `type` keyword for type imports (`consistent-type-imports` enforced).

## Environment

- `VITE_API_BASE_URL` — Required. Base URL for API requests. Fallback: `https://api.example.com`.
- Copy `.env.example` to `.env` to configure.
