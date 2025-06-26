import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactIntl from "@calm/eslint-plugin-react-intl";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        THREE: true,
        AFRAME: true,
        NAF: true,
        APP: true
      }
    },
    plugins: {
      prettier,
      react,
      "react-hooks": reactHooks,
      "@calm/react-intl": reactIntl
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      "prettier/prettier": "error",
      "prefer-const": "error",
      "no-use-before-define": "error",
      "no-var": "error",
      "no-throw-literal": "error",
      "no-unused-vars": [
        "error",
        {
          destructuredArrayIgnorePattern: "^_"
        }
      ],
      "no-console": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "react/prop-types": "error",
      "@calm/react-intl/missing-formatted-message": "error",
      "@calm/react-intl/missing-attribute": "error",
      "@calm/react-intl/missing-values": "error",
      ...react.configs.recommended.rules
    }
  }
];
