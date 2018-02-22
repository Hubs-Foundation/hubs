const path = require("path");
const merge = require("webpack-merge");
const common = require("./webpack.common");
const WriteFilePlugin = require("write-file-webpack-plugin");
const fs = require("fs");

module.exports = merge(common, {
  devtool: "inline-source-map",
  devServer: {
    contentBase: path.resolve(__dirname, "public"),
    disableHostCheck: true,
    before: function (app) {
      // networked-aframe makes HEAD requests to the server for time syncing. Respond with an empty body.
      app.head('\*', function (req, res, next) {
        if (req.method === 'HEAD') { 
          res.send('');
        }
        else {
          next();
        }
      });
    }
  },
  plugins: [new WriteFilePlugin()]
});
