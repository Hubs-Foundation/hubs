const merge = require("webpack-merge");
const MinifyPlugin = require("babel-minify-webpack-plugin");
const common = require("./webpack.common");

module.exports = merge(common, {
  devtool: "source-map",
  plugins: [new MinifyPlugin()]
});
