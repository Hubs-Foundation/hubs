module.exports = {
  parser: "babel-eslint",
  env: {
    browser: true,
    es6: true,
    node: true
  },
  globals: {
    THREE: true,
    AFRAME: true,
    NAF: true
  },
  plugins: ["prettier", "react", "react-hooks", "@calm/react-intl"],
  rules: {
    "prettier/prettier": "error",
    "prefer-const": "error",
    "no-use-before-define": "error",
    "no-var": "error",
    "no-throw-literal": "error",
    // Light console usage is useful but remove debug logs before merging to master.
    "no-console": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    // TODO: Move to throwing lint errors for react-intl once migration is complete
    "@calm/react-intl/missing-formatted-message": [
      "warn",
      {
        noTrailingWhitespace: true,
        ignoreLinks: true,
        enforceLabels: true,
        enforceImageAlts: true,
        enforceInputProps: false
      }
    ],
    "@calm/react-intl/missing-attribute": [
      "warn",
      {
        noTrailingWhitespace: true,
        noSpreadOperator: true,
        requireDescription: false,
        formatDefineMessages: true,
        requireIdAsString: true,
        requireDefaultMessage: true
      }
    ],
    "@calm/react-intl/missing-values": "warn"
  },
  extends: ["prettier", "plugin:react/recommended", "eslint:recommended"]
};
