module.exports = {
  presets: [
    "@babel/react",
    [
      "@babel/env",
      {
        exclude: ["transform-regenerator"],
        // targets are defined in .browserslistrc
        // false = do not polyfill stuff unneccessarily
        useBuiltIns: false
      }
    ]
  ],
  plugins: [
    // TODO: When i18n build pipeline is finished move to: [ "react-intl", { "removeDefaultMessage": true } ]
    "react-intl",
    "transform-react-jsx-img-import",
    ["@babel/proposal-class-properties", { loose: true }],
    ["@babel/plugin-proposal-private-property-in-object", { loose: true }],
    ["@babel/plugin-proposal-private-methods", { loose: true }],
    "@babel/proposal-object-rest-spread",
    // Samsung Internet on the Oculus Go version is stuck at version 5.2, which is a
    // Chromium 51, as of this writing. It needs babel to transpile async/await.
    "@babel/plugin-transform-async-to-generator",
    "@babel/plugin-proposal-optional-chaining"
  ]
};
