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
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.worker,
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
      "@calm/react-intl/missing-formatted-message": [
        "error",
        {
          noTrailingWhitespace: true,
          ignoreLinks: true,
          enforceLabels: true,
          enforceImageAlts: true,
          enforceInputProps: false
        }
      ],
      "@calm/react-intl/missing-attribute": [
        "error",
        {
          noTrailingWhitespace: true,
          noSpreadOperator: true,
          requireDescription: false,
          formatDefineMessages: true,
          requireIdAsString: true,
          requireDefaultMessage: true
        }
      ],
      "@calm/react-intl/missing-values": "error",
      ...react.configs.recommended.rules
    }
  }
];
