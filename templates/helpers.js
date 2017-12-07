const Handlebars = require("handlebars");
const path = require("path");
const fs = require("fs");
const crc = require("crc");

module.exports = {
  /**
   * Register a handlebars helper that prepends the base asset path.
   * Useful for things like placing assets on a CDN and cache busting.
   * Example:
   * input: <img src="{{asset "asset.png"}}"/>
   * output: <img src="https://cdn.mysite.com/asset.png?sha="/>
   */
  asset: (assetPath, options) => {
    // In the development environment just use the original asset path.
    if (process.env.NODE_ENV !== "production") {
      return new Handlebars.SafeString(assetPath);
    }

    const compilation = options.data.root.compilation;

    let asset;
    if (compilation.assets[assetPath]) {
      asset = compilation.assets[assetPath].source();
    } else {
      const outputPath = options.data.root.compiler.options.output.path;
      const localPath = path.join(outputPath, assetPath);
      asset = fs.readFileSync(localPath);
    }

    const hash = crc.crc32(asset).toString(16);

    const baseAssetsPath = options.data.root.baseAssetsPath || "";
    const cacheBustQueryString = "?crc=" + hash;

    const url = baseAssetsPath + assetPath + cacheBustQueryString;

    return new Handlebars.SafeString(url);
  },
  toJSON: obj => {
    return new Handlebars.SafeString(JSON.stringify(obj));
  }
};
