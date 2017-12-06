const path = require("path");
const glob = require("glob");
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
      pages,
      helpers
    })
  ]
};
