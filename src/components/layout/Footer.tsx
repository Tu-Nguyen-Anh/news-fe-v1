import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
      <p className="text-center text-sm text-gray-500">
        {t("layout.copyright", { year })}
      </p>
    </footer>
  );
}
