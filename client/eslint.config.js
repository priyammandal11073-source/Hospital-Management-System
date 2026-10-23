import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: ["node_modules/**", "dist/**", "coverage/**", "android/**"],
  },
  js.configs.recommended,
  react.configs.flat["jsx-runtime"],
  {
    files: ["**/*.{js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // React 19 compiler-era performance rules; noisy for existing patterns,
      // keep as warnings so they surface without failing CI.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-useless-escape": "warn",
      "no-constant-condition": ["warn", { checkLoops: false }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
    },
  },
];