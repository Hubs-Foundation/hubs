module.exports = {
  sourceMaps: true,
  presets: [
    "@babel/react",
    [
      "@babel/env",
      {
        // targets are defined in .browserslistrc
        useBuiltIns: "usage",
        // This should be kept up to date with the version in package.json
        corejs: "3.42.0",
        // We care more about perf than exactly conforming to the spec
        loose: true,
        exclude: [
          // These exist since forever but end up being polyfilled anyway because of an obscure issue if length is not writeable
          "es.array.push",
          "es.array.unshift",
          "es.promise", // Native in all modern browsers
          "es.object.assign", // Native in Chrome 45+
          "es.array.includes", // Native in Chrome 47+
          "es.string.includes", // Native in Chrome 41+
          "es.array.from", // Native in Chrome 45+, Safari 9+
          "es.array.of", // Native in Chrome 45+, Safari 9+
          "es.array.find", // Native in Chrome 45+, Safari 9+
          "es.array.find-index", // Native in Chrome 45+, Safari 9+
          "es.string.starts-with", // Native in Chrome 41+, Safari 9+
          "es.string.ends-with", // Native in Chrome 41+, Safari 9+
          "es.string.repeat", // Native in Chrome 41+, Safari 9+
          "es.number.is-finite", // Native in Chrome 19+, Safari 9+
          "es.number.is-integer", // Native in Chrome 34+, Safari 9+
          "es.number.is-nan", // Native in Chrome 25+, Safari 9+
          "es.object.keys", // Native in all browsers since IE9
          "es.object.values", // Native in Chrome 54+, Safari 10.1+
          "es.object.entries", // Native in Chrome 54+, Safari 10.1+
          "es.array.flat", // Native in Chrome 69+, Safari 12+
          "es.array.flat-map", // Native in Chrome 69+, Safari 12+
          "es.string.pad-start", // Native in Chrome 57+, Safari 10+
          "es.string.pad-end", // Native in Chrome 57+, Safari 10+
          "es.string.trim-start", // Native in Chrome 66+, Safari 12+
          "es.string.trim-end", // Native in Chrome 66+, Safari 12+
          "es.map", // Native in Chrome 38+, Safari 9+
          "es.set", // Native in Chrome 38+, Safari 9+
          "es.weak-map", // Native in Chrome 36+, Safari 9+
          "es.weak-set", // Native in Chrome 36+, Safari 9+
          "es.symbol", // Native in Chrome 38+, Safari 9+
          "es.symbol.iterator", // Native in Chrome 38+, Safari 9+
          "es.regexp.flags", // Native in Chrome 62+, Safari 12+
          "es.regexp.to-string", // Native in Chrome 50+, Safari 10+
          "es.string.match-all", // Native in Chrome 73+, Safari 13+
          "es.string.replace-all", // Native in Chrome 85+, Safari 13.1+
          "es.promise.finally", // Native in Chrome 63+, Safari 11.1+
          "es.promise.all-settled", // Native in Chrome 76+, Safari 13+
          "es.array.fill", // Native in Chrome 45+, Safari 9+
          "es.array.copy-within", // Native in Chrome 45+, Safari 9+
          "es.math.trunc", // Native in Chrome 38+, Safari 8+
          "es.math.sign", // Native in Chrome 38+, Safari 9+
          "es.function.name", // Native in Chrome 51+, Safari 10+
          "es.object.get-own-property-descriptors", // Native in Chrome 54+, Safari 10+
          "es.date.to-iso-string", // Native in all modern browsers
          "web.dom-collections.for-each", // Native in Chrome 58+, Safari 10+
          "web.dom-collections.iterator", // Native in Chrome 38+, Safari 9+
          "web.url", // Native in Chrome 32+, Safari 14+
          "web.url-search-params" // Native in Chrome 49+, Safari 14+
        ],
        // Enable to see resolved targets and polyfills being used
        debug: false
      }
    ],
    "@babel/typescript"
  ],
  plugins: [
    // TODO: When i18n build pipeline is finished move to: [ "formatjs", { "removeDefaultMessage": true } ]
    "formatjs",
    // Private fields/methods not yet supported in Safari 15 (2012 MacBook and iPhone 7, added in Safari 16.4)
    // Other supported browser all have this as native: Chrome 91 (Oculus Go), Firefox/Gecko 116 (Wolvic HTC Vive)
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    ["@babel/plugin-proposal-private-property-in-object", { loose: true }],
    ["@babel/plugin-proposal-private-methods", { loose: true }]
  ]
};
