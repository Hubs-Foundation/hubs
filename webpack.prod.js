const webpack = require("webpack");
const merge = require("webpack-merge");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const path = require("path");
const common = require("./webpack.common");

module.exports = merge(common, {
  devtool: "source-map",
  plugins: [
    new CleanWebpackPlugin("public", {
      exclude: path.join(__dirname, "public", "assets")
    }),
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
