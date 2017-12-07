const path = require("path");
const glob = require("glob");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const HandlebarsTemplatePlugin = require("./templates/HandlebarsTemplatePlugin");
const helpers = require("./templates/helpers");
const config = require("./config");

const templatePaths = glob.sync("./templates/*.hbs");
const pages = [];

for (const templatePath of templatePaths) {
  const fileName = path.basename(templatePath, ".hbs");

  // Generate html pages for each .hbs template in /templates
  pages.push({
    fileName: fileName + ".html",
    templatePath,
    data: {
      baseAssetsPath: process.env.BASE_ASSETS_PATH,
      config
    }
  });

  // Generate html pages for smoke tests
  if (process.env.GENERATE_SMOKE_TESTS) {
    pages.push({
      fileName: "smoke-" + fileName + ".html",
      templatePath,
      data: {
        baseAssetsPath:
          process.env.BASE_ASSETS_PATH &&
          process.env.BASE_ASSETS_PATH.replace("https://", "https://smoke-"),
        config: {
          ...config,
          global: {
            ...config.global,
            janus_server_url: config.global.janus_server_url.replace(
              "wss://",
              "wss://smoke-"
            )
          }
        }
      }
    });
  }
}

module.exports = {
  entry: {
    room: path.join(__dirname, "src", "room"),
    lobby: path.join(__dirname, "src", "lobby")
  },
  output: {
    filename: "[name].js",
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
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: {
          loader: "file-loader",
          options: {
            emitFile: false,
            outputPath(url) {
              // Rewrite the url to correctly reference the copied assets directory.
              return url.replace("src/assets/", "assets/");
            },
            name(file) {
              if (process.env.NODE_ENV === "production") {
                return "[path][name].[ext]?md5=[hash]";
              }

              return "[path][name].[ext]";
            }
          }
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin("public"),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, "src", "assets"),
        to: "assets"
      }
    ]),
    new webpack.optimize.CommonsChunkPlugin({
      name: "lobby-vendor",
      chunks: ["lobby"],
      minChunks: function(module) {
        return module.context && module.context.indexOf("node_modules") !== -1;
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "room-vendor",
      chunks: ["room"],
      minChunks: function(module) {
        return module.context && module.context.indexOf("node_modules") !== -1;
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "manifest",
      minChunks: Infinity
    }),
    new ExtractTextPlugin("[name].css", {
      disable: process.env.NODE_ENV !== "production"
    }),
    new HandlebarsTemplatePlugin({
      pages,
      helpers
    })
  ]
};
