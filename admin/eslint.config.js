const js = require("@eslint/js");
const globals = require("globals");
const prettier = require("eslint-plugin-prettier");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const reactIntl = require("@calm/eslint-plugin-react-intl");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  js.configs.recommended,
  prettierConfig,
  {
    ignores: ["**/node_modules/", "dist/", "*.min.js"]
  },
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
