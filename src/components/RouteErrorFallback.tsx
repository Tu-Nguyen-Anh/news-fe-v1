import { Link } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function RouteErrorFallback({ error, reset }: ErrorComponentProps) {
  const { t } = useTranslation();

  const title = t("error.unexpectedTitle");
  const message = error.message || t("error.unexpectedMessage");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-gray-300">{title}</h1>
      <p className="max-w-md text-center text-gray-500">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
        >
          {t("error.refresh")}
        </button>
        <Link
          to="/"
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {t("error.goHome")}
        </Link>
      </div>
    </div>
  );
}
