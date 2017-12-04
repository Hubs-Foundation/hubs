const path = require("path");
const HandlebarsTemplatePlugin = require("./templates/HandlebarsTemplatePlugin");
const Handlebars = require("handlebars");

module.exports = {
  entry: {
    app: path.join(__dirname, "src", "index"),
    lobby: path.join(__dirname, "src", "lobby")
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "public")
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [path.resolve(__dirname, "src")],
        exclude: [path.resolve(__dirname, "node_modules")],
        loader: "babel-loader"
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  plugins: [
    new HandlebarsTemplatePlugin({
      templatesPath: path.resolve(__dirname, "templates"),
      helpers: {
        /**
         * Register a handlebars helper that prepends the base asset path.
         * Useful for things like placing assets on a CDN and cache busting.
         * Example:
         * input: <img src="{{asset "asset.png"}}"/>
         * output: <img src="https://cdn.mysite.com/asset.png?c="/>
         */
        asset: assetPath => {
          const isProd = process.env.NODE_ENV === "production";
          const baseAssetsPath = process.env.BASE_ASSETS_PATH || "/";
          const cacheBustQueryString = isProd ? "?c=" + Date.now() : "";

          const url = baseAssetsPath + assetPath + cacheBustQueryString;

          return new Handlebars.SafeString(url);
        }
      }
    })
  ]
};
