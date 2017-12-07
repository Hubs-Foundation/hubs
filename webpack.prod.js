const webpack = require("webpack");
const merge = require("webpack-merge");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const common = require("./webpack.common");

module.exports = merge(common, {
  devtool: "source-map",
  plugins: [
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
