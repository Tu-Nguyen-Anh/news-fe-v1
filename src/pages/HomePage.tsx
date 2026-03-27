import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: users, isLoading, isError } = useUsers();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{t("home.dashboard")}</h1>
      {user && (
        <p className="mt-1 text-gray-500">{t("home.welcomeBack", { name: user.full_name })}</p>
      )}

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">{t("home.users")}</h2>

        {isLoading && <p className="text-gray-500">{t("home.loadingUsers")}</p>}
        {isError && <p className="text-red-500">{t("home.loadError")}</p>}

        {users && (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="min-w-0 font-medium text-gray-900">{u.full_name}</span>
                <span className="min-w-0 truncate text-sm text-gray-500 sm:text-right">{u.email}</span>
                <span
                  className={
                    u.status === 0
                      ? "w-fit rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                      : "w-fit rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                  }
                >
                  {u.status === 0 ? "Hoạt động" : "Vô hiệu hóa"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
