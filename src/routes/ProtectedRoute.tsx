import { Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import PageLoader from "@/components/ui/PageLoader";

export function ProtectedRoute() {
  const { isAuthenticated, isFetchingUser } = useAuth();

  if (isFetchingUser) {
    return <PageLoader />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}
