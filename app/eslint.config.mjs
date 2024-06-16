import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactEslint from "eslint-plugin-react";
import reactHooksEslint from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import typescriptEslint from "typescript-eslint";

export default [
  js.configs.recommended,
  eslintPluginPrettierRecommended,
  ...typescriptEslint.configs.recommended,
  {
    ignores: ["**/node_modules", "**/public", "**/build"],
  },
  {
    plugins: {
      "jsx-a11y": jsxA11Y,
      "simple-import-sort": simpleImportSort,
      react: reactEslint.configs.recommended,
      "react-hooks": reactHooksEslint.configs.recommended,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        tsconfigRootDir: "src/",
      },
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
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
];
