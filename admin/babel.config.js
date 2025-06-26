// Custom babel config for admin that avoids core-js conflicts
module.exports = {
  sourceMaps: true,
  presets: [
    "@babel/react",
    [
      "@babel/env",
      {
        // Don't inject core-js polyfills automatically
        useBuiltIns: false,
        loose: true
      }
    ],
    "@babel/typescript"
  ],
  plugins: [
    "formatjs",
    ["@babel/plugin-transform-private-property-in-object", { loose: true }],
    ["@babel/plugin-transform-private-methods", { loose: true }]
  ]
};
