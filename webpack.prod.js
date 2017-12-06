const merge = require("webpack-merge");
const MinifyPlugin = require("babel-minify-webpack-plugin");
const common = require("./webpack.common");
const path = require("path");
const config = require("./config");
const HandlebarsTemplatePlugin = require("./templates/HandlebarsTemplatePlugin");
const helpers = require("./templates/helpers");

module.exports = merge(common, {
  devtool: "source-map",
  plugins: [
    new MinifyPlugin(),
    new HandlebarsTemplatePlugin({
      pages: [
        {
          fileName: "index.html",
          templatePath: path.resolve(__dirname, "templates", "index.hbs"),
          data: {
            baseAssetsPath: process.env.BASE_ASSETS_PATH,
            config
          }
        },
        {
          fileName: "room.html",
          templatePath: path.resolve(__dirname, "templates", "room.hbs"),
          data: {
            baseAssetsPath: process.env.BASE_ASSETS_PATH,
            config
          }
        },
        {
          fileName: "smoke-test.html",
          templatePath: path.resolve(__dirname, "templates", "room.hbs"),
          data: {
            baseAssetsPath: process.env.BASE_ASSETS_PATH.replace(
              "https://",
              "https://smoke."
            ),
            config: {
              ...config,
              global: {
                ...config.global,
                janus_server_url: config.global.janus_server_url.replace(
                  "wss://",
                  "wss://smoke."
                )
              }
            }
          }
        }
      ],
      helpers
    })
  ]
});
