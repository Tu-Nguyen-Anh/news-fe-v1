import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from "@tanstack/react-router";
import { ProtectedRoute } from "./ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { RouteErrorFallback } from "@/components/RouteErrorFallback";
import PageLoader from "@/components/ui/PageLoader";

// ─── Root ─────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute();

// ─── Auth layout (public) ─────────────────────────────────────────────────────

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "auth-layout",
  component: AuthLayout,
});

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/login",
  component: lazyRouteComponent(() => import("@/pages/LoginPage")),
});

// ─── Protected layout ─────────────────────────────────────────────────────────

const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected-layout",
  component: ProtectedRoute,
});

const mainLayoutRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  id: "main-layout",
  component: MainLayout,
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

const homeRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/",
  component: lazyRouteComponent(() => import("@/pages/DashboardPage")),
});

// ─── Users ────────────────────────────────────────────────────────────────────

const usersRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/users",
  component: lazyRouteComponent(() => import("@/pages/users/UserListPage")),
});

const userCreateRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/users/create",
  component: lazyRouteComponent(() =>
    import("@/pages/users/UserFormPage").then((m) => ({
      default: () => m.default({ mode: "create" }),
    }))
  ),
});

const userDetailRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/users/$id",
  component: lazyRouteComponent(() => import("@/pages/users/UserDetailPage")),
});

const userEditRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/users/$id/edit",
  component: lazyRouteComponent(() =>
    import("@/pages/users/UserFormPage").then((m) => ({
      default: () => m.default({ mode: "edit" }),
    }))
  ),
});

// ─── Sources ──────────────────────────────────────────────────────────────────

const sourcesRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/sources",
  component: lazyRouteComponent(() => import("@/pages/sources/SourceListPage")),
});

const sourceCreateRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/sources/create",
  component: lazyRouteComponent(() =>
    import("@/pages/sources/SourceFormPage").then((m) => ({
      default: () => m.default({ mode: "create" }),
    }))
  ),
});

const sourceDetailRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/sources/$id",
  component: lazyRouteComponent(() => import("@/pages/sources/SourceDetailPage")),
});

const sourceEditRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/sources/$id/edit",
  component: lazyRouteComponent(() =>
    import("@/pages/sources/SourceFormPage").then((m) => ({
      default: () => m.default({ mode: "edit" }),
    }))
  ),
});

// ─── Topics ───────────────────────────────────────────────────────────────────

const topicsRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/topics",
  component: lazyRouteComponent(() => import("@/pages/topics/TopicListPage")),
});

const topicCreateRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/topics/create",
  component: lazyRouteComponent(() =>
    import("@/pages/topics/TopicFormPage").then((m) => ({
      default: () => m.default({ mode: "create" }),
    }))
  ),
});

const topicDetailRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/topics/$id",
  component: lazyRouteComponent(() => import("@/pages/topics/TopicDetailPage")),
});

const topicEditRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/topics/$id/edit",
  component: lazyRouteComponent(() =>
    import("@/pages/topics/TopicFormPage").then((m) => ({
      default: () => m.default({ mode: "edit" }),
    }))
  ),
});

// ─── Articles ─────────────────────────────────────────────────────────────────

const articlesRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/articles",
  component: lazyRouteComponent(() => import("@/pages/articles/ArticleListPage")),
});

const articleCreateRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/articles/create",
  component: lazyRouteComponent(() =>
    import("@/pages/articles/ArticleFormPage").then((m) => ({
      default: () => m.default({ mode: "create" }),
    }))
  ),
});

const articleDetailRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/articles/$id",
  component: lazyRouteComponent(() => import("@/pages/articles/ArticleDetailPage")),
});

const articleEditRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/articles/$id/edit",
  component: lazyRouteComponent(() =>
    import("@/pages/articles/ArticleFormPage").then((m) => ({
      default: () => m.default({ mode: "edit" }),
    }))
  ),
});

// ─── Profile ─────────────────────────────────────────────────────────────────

const profileRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/profile",
  component: lazyRouteComponent(() => import("@/pages/ProfilePage")),
});

// ─── Blog ─────────────────────────────────────────────────────────────────────

const blogFeedRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/blog",
  component: lazyRouteComponent(() => import("@/pages/blog/BlogFeedPage")),
});

const blogPostDetailRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/blog/post/$postId",
  component: lazyRouteComponent(() => import("@/pages/blog/BlogPostDetailPage")),
});

const blogUserProfileRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/blog/profile/$userId",
  component: lazyRouteComponent(() => import("@/pages/blog/BlogUserProfilePage")),
});

// ─── Chat ─────────────────────────────────────────────────────────────────────

const chatRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/chat",
  component: lazyRouteComponent(() => import("@/pages/chat/ChatPage")),
});

// ─── Follow Topics ────────────────────────────────────────────────────────────

const followTopicsRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/follow",
  component: lazyRouteComponent(() => import("@/pages/follow/FollowTopicPage")),
});

// ─── Favorites & View History ─────────────────────────────────────────────────

const favoritesRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/favorites",
  component: lazyRouteComponent(() => import("@/pages/favorites/FavoritesPage")),
});

const viewHistoryRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/view-history",
  component: lazyRouteComponent(() => import("@/pages/favorites/ViewHistoryPage")),
});

// ─── Route tree & router ──────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  authLayoutRoute.addChildren([loginRoute]),
  protectedLayoutRoute.addChildren([
    mainLayoutRoute.addChildren([
      homeRoute,
      usersRoute,
      userCreateRoute,
      userDetailRoute,
      userEditRoute,
      sourcesRoute,
      sourceCreateRoute,
      sourceDetailRoute,
      sourceEditRoute,
      topicsRoute,
      topicCreateRoute,
      topicDetailRoute,
      topicEditRoute,
      articlesRoute,
      articleCreateRoute,
      articleDetailRoute,
      articleEditRoute,
      profileRoute,
      chatRoute,
      followTopicsRoute,
      favoritesRoute,
      viewHistoryRoute,
      blogFeedRoute,
      blogPostDetailRoute,
      blogUserProfileRoute,
    ]),
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPendingComponent: PageLoader,
  defaultErrorComponent: RouteErrorFallback,
  defaultNotFoundComponent: lazyRouteComponent(() => import("@/pages/NotFoundPage")),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
