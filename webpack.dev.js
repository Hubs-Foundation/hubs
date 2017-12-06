const path = require("path");
const merge = require("webpack-merge");
const common = require("./webpack.common");
const config = require("./config");
const HandlebarsTemplatePlugin = require("./templates/HandlebarsTemplatePlugin");
const helpers = require("./templates/helpers");

module.exports = merge(common, {
  devtool: "inline-source-map",
  devServer: {
    contentBase: path.resolve(__dirname, "public"),
    disableHostCheck: true
  },
  plugins: [
    new HandlebarsTemplatePlugin({
      pages: [
        {
          fileName: "index.html",
          templatePath: path.resolve(__dirname, "templates", "index.hbs"),
          data: {
            config
          }
        },
        {
          fileName: "room.html",
          templatePath: path.resolve(__dirname, "templates", "room.hbs"),
          data: {
            config
          }
        }
      ],
      helpers
    })
  ]
});
