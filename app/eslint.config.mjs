import js from "@eslint/js";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactHooksEslint from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules",
      "**/public",
      "**/playwright-report",
      "**/dist",
    ],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      eslintPluginPrettierRecommended,
    ],
    files: ["**/*.{ts,tsx,mjs}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooksEslint,
      "jsx-a11y": jsxA11Y,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      ...reactHooksEslint.configs.recommended.rules,
      "prettier/prettier": "error",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Packages `react` related packages come first.
            ["^react", "^@?\\w"],
            // Internal packages.
            ["^(@|components)(/.*|$)"],
            // Internal packages.
            ["^(assets/js)(/.*|$)"],
            // Side effect imports.
            ["^\\u0000"],
            // Parent imports. Put `..` last.
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            // Other relative imports. Put same-folder imports and `.` last.
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            // Style imports.
            ["^.+\\.?(css)$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
);
