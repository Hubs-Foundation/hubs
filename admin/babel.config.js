// Custom babel config for admin that avoids core-js conflicts
module.exports = {
  sourceMaps: true,
  presets: [
    "@babel/preset-react",
    [
      "@babel/preset-env",
      {
        // Don't inject core-js polyfills automatically
        useBuiltIns: false,
        loose: true
      }
    ],
    "@babel/preset-typescript"
  ],
  plugins: [
    // TODO: When i18n build pipeline is finished move to: [ "formatjs", { "removeDefaultMessage": true } ]
    "formatjs",
    // Private fields/methods not yet supported in Safari 15 (2012 MacBook and iPhone 7, added in Safari 16.4)
    // Other supported browser all have this as native: Chrome 91 (Oculus Go), Firefox/Gecko 116 (Wolvic HTC Vive)
    ["@babel/plugin-transform-class-properties", { loose: true }],
    ["@babel/plugin-transform-private-property-in-object", { loose: true }],
    ["@babel/plugin-transform-private-methods", { loose: true }]
  ]
};
