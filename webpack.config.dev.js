var path = require("path");
var webpack = require("webpack");

module.exports = {
  entry: {
    app: ["webpack-hot-middleware/client?reload=true", "./src/index.js"]
  },
  devtool: "inline-source-map",
  plugins: [new webpack.HotModuleReplacementPlugin()],
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "public"),
    publicPath: "/"
  }
};
