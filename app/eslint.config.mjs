import js from "@eslint/js";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import reactHooksEslint from "eslint-plugin-react-hooks";
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from "eslint-plugin-simple-import-sort";

import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: [
    "**/node_modules",
    "**/public",
    "**/playwright-report",
    "**/dist",
  ], },
  {
    extends: [js.configs.recommended, 
      ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooksEslint,
      'react-refresh': reactRefresh,
      "jsx-a11y": jsxA11Y,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      ...reactHooksEslint.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
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
)