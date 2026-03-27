import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", label: "EN" },
  { code: "vi", label: "VI" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
  };

  return (
    <div className="flex gap-1">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => changeLanguage(code)}
          className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
            i18n.language === code
              ? "bg-primary-600 text-white"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
