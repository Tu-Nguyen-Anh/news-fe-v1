import { Outlet } from "@tanstack/react-router";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
        <LanguageSwitcher />
      </div>
      <Outlet />
    </main>
  );
}
