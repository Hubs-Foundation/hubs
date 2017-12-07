const webpack = require("webpack");
const merge = require("webpack-merge");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const path = require("path");
const common = require("./webpack.common");

module.exports = merge(common, {
  devtool: "source-map",
  plugins: [
    new CleanWebpackPlugin("public"),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, "src", "assets"),
        to: "assets"
      }
    ]),
    new OptimizeCssAssetsPlugin(),
    new UglifyJsPlugin({
      parallel: true,
      sourceMap: true
    }),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": "'production'"
    })
  ]
});
