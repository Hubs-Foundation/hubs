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
    ignores: [
      "src/vendor/*",
      "src/loaders/basis_transcoder.worker.js",
      "scripts/bot/node_modules/",
      "scripts/docker/turkey-swaps/",
      "**/node_modules/",
      "dist/",
      "*.min.js"
    ]
  },
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
      // React recommended rules
      "react/display-name": "error",
      "react/jsx-key": "error",
      "react/jsx-no-comment-textnodes": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-target-blank": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "react/no-children-prop": "error",
      "react/no-danger-with-children": "error",
      "react/no-deprecated": "error",
      "react/no-direct-mutation-state": "error",
      "react/no-find-dom-node": "error",
      "react/no-is-mounted": "error",
      "react/no-render-return-value": "error",
      "react/no-string-refs": "error",
      "react/no-unescaped-entities": "error",
      "react/no-unknown-property": "error",
      "react/no-unsafe": "off",
      "react/prop-types": "error",
      "react/react-in-jsx-scope": "error",
      "react/require-render-return": "error"
    }
  }
];
