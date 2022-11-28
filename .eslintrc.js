// https://eslint.org/
module.exports = {
  parser: "@babel/eslint-parser",
  env: {
    browser: true,
    es6: true,
    node: true
  },
  globals: {
    THREE: true,
    AFRAME: true,
    NAF: true,
    APP: true
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  plugins: ["prettier", "react", "react-hooks", "@calm/react-intl"],
  // https://eslint.org/docs/rules/
  rules: {
    "no-prototype-builtins": "error",

    // TODO these are new as of our Webpack 5 upgrade, making them warnings till we get a handle on them or decide we don't want them
    "react/prop-types": "error",
    "react/display-name": "error",
    "no-redeclare": "error",
    "no-async-promise-executor": "error",

    // TODO temporarily disable migrating to prettier 2.0 until we reformat everything in  its own PR
    "prettier/prettier": "error",

    // https://github.com/prettier/eslint-plugin-prettier
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
    // Light console usage is useful but remove debug logs before merging to master.
    "no-console": "off",
    // https://www.npmjs.com/package/eslint-plugin-react-hooks
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
    // https://github.com/calm/eslint-plugin-react-intl
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
    "@calm/react-intl/missing-values": "error"
  },
  extends: ["prettier", "plugin:react/recommended", "eslint:recommended", "plugin:storybook/recommended"]
};
