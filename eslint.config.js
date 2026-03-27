import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";

export default defineConfig([
  // ── Ignored paths ──────────────────────────────────────────────────────────
  globalIgnores(["dist", "node_modules", "coverage", "*.min.js"]),

  // ── TypeScript + React source files ────────────────────────────────────────
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      // Must be last — disables all rules that Prettier handles
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // ── TypeScript ──────────────────────────────────────────────────────────
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // ── React ───────────────────────────────────────────────────────────────
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // ── General ─────────────────────────────────────────────────────────────
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
]);
