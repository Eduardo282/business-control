import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  // ── Global ignores ──────────────────────────────────────────────
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.pnpm-store/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },

  // ── Base: recommended JS rules for ALL files ────────────────────
  js.configs.recommended,

  // ── Backend + Shared: Node.js environment ───────────────────────
  {
    files: ["backend/**/*.js", "shared/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },

  // ── Frontend: React + Browser environment ───────────────────────
  {
    files: ["frontend/**/*.{js,jsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // React
      ...reactPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/display-name": "off",

      // Hooks
      ...reactHooksPlugin.configs.recommended.rules,
      "react-hooks/set-state-in-effect": "off",

      // General
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
    },
  },

  // Architecture boundaries: domain code stays framework and adapter agnostic.
  {
    files: ["frontend/src/features/*/domain/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              message: "Feature domain modules must remain framework-independent.",
            },
            {
              name: "react-dom",
              message: "Feature domain modules must remain framework-independent.",
            },
            {
              name: "react-router-dom",
              message: "Routing belongs outside feature domain modules.",
            },
          ],
          patterns: [
            {
              group: [
                "react/**",
                "react-dom/**",
                "**/actionsAPI/**",
                "**/components/**",
                "**/context/**",
                "**/hooks/**",
                "**/pages/**",
                "**/services/**",
              ],
              message:
                "Feature domain modules may depend only on domain or shared pure utilities.",
            },
            {
              regex: "\\.jsx(?:$|[?#])",
              message: "Feature domain modules must not import JSX modules.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXElement",
          message: "Feature domain modules must remain JSX-free.",
        },
        {
          selector: "JSXFragment",
          message: "Feature domain modules must remain JSX-free.",
        },
        {
          selector: "ImportExpression",
          message: "Feature domain modules must not use dynamic imports.",
        },
      ],
    },
  },

  {
    files: ["backend/src/modules/*/domain/**/*.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/config/**",
                "**/graphql/**",
                "**/middlewares/**",
                "**/repositories/**",
                "**/routes/**",
                "**/server/**",
                "**/services/**",
                "**/application/**",
                "**/infrastructure/**",
              ],
              message:
                "Domain modules may depend only on domain or shared pure utilities.",
            },
            {
              regex: "^(?:\\.\\./)+[^/]+\\.js$",
              message:
                "Domain modules must not import their module composition root.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportExpression",
          message: "Domain modules must not use dynamic imports.",
        },
      ],
    },
  },

  {
    files: ["backend/src/modules/*/application/**/*.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/config/**",
                "**/graphql/**",
                "**/middlewares/**",
                "**/repositories/**",
                "**/routes/**",
                "**/server/**",
                "**/services/**",
                "**/infrastructure/**",
              ],
              message:
                "Application modules must receive infrastructure through explicit dependencies.",
            },
            {
              regex: "^(?:\\.\\./)+[^/]+\\.js$",
              message:
                "Application modules must not import their module composition root.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportExpression",
          message: "Application modules must not use dynamic imports.",
        },
      ],
    },
  },

  // ── Root config/scripts (playwright, vitest, etc.) ──────────────
  {
    // <-- CORREGIDO: Añadidos .mjs y cualquier archivo .config.js en cualquier carpeta
    files: ["*.js", "*.mjs", "tests/**/*.js", "tests/**/*.mjs", "**/*.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
];
