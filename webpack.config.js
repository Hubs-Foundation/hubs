// Variables in .env will be added to process.env
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const selfsigned = require("selfsigned");
const webpack = require("webpack");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const _ = require("lodash");

function createHTTPSConfig() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  let https;

  // Generate certs for the local webpack-dev-server.
  if (fs.existsSync(path.join(__dirname, "certs"))) {
    const key = fs.readFileSync(path.join(__dirname, "certs", "key.pem"));
    const cert = fs.readFileSync(path.join(__dirname, "certs", "cert.pem"));

    return { key, cert };
  } else {
    const pems = selfsigned.generate(
      [
        {
          name: "commonName",
          value: "localhost"
        }
      ],
      {
        days: 365,
        algorithm: "sha256",
        extensions: [
          {
            name: "subjectAltName",
            altNames: [
              {
                type: 2,
                value: "localhost"
              }
            ]
          }
        ]
      }
    );

    fs.mkdirSync(path.join(__dirname, "certs"));
    fs.writeFileSync(path.join(__dirname, "certs", "cert.pem"), pems.cert);
    fs.writeFileSync(path.join(__dirname, "certs", "key.pem"), pems.private);

    return {
      key: pems.public,
      cert: pems.cert
    };
  }
}

class LodashTemplatePlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.plugin("compilation", compilation => {
      compilation.plugin("html-webpack-plugin-before-html-processing", async data => {
        data.html = _.template(data.html, this.options)();
        return data;
      });
    });
  }
}

module.exports = {
  entry: {
    lobby: path.join(__dirname, "src", "lobby.js"),
    room: path.join(__dirname, "src", "room.js"),
    onboarding: path.join(__dirname, "src", "onboarding.js")
  },
  output: {
    path: path.join(__dirname, "public"),
    filename: "[name]-[chunkhash].js"
  },
  mode: "development",
  devtool: process.env.NODE_ENV === "production" ? "source-map" : "inline-source-map",
  devServer: {
    open: true,
    https: createHTTPSConfig(),
    host: "0.0.0.0",
    port: 8080,
    before: function(app) {
      // networked-aframe makes HEAD requests to the server for time syncing. Respond with an empty body.
      app.head("*", function(req, res, next) {
        if (req.method === "HEAD") {
          res.send("");
        } else {
          next();
        }
      });
    }
  },
  performance: {
    // Ignore media and sourcemaps when warning about file size.
    assetFilter(assetFilename) {
      return !/\.(map|png|jpg|gif|glb)$/.test(assetFilename);
    }
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: "html-loader",
        options: {
          // <a-asset-item>'s src property is overwritten with the correct transformed asset url.
          attrs: ["img:src", "a-asset-item:src", "audio:src"],
          // You can get transformed asset urls in an html template using ${require("pathToFile.ext")}
          interpolate: "require"
        }
      },
      {
        test: /\.js$/,
        include: [path.resolve(__dirname, "src")],
        // Exclude JS assets in node_modules because they are already transformed and often big.
        exclude: [path.resolve(__dirname, "node_modules")],
        loader: "babel-loader",
        query: {
          plugins: ["transform-class-properties", "transform-object-rest-spread"]
        }
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: {
            loader: "css-loader",
            options: {
              minimize: process.env.NODE_ENV === "production"
            }
          }
        })
      },
      {
        test: /\.(png|jpg|gif|glb|ogg)$/,
        use: {
          loader: "file-loader",
          options: {
            // move required assets to /public and add a hash for cache busting
            name: "[path][name]-[hash].[ext]",
            // Make asset paths relative to /src
            context: path.join(__dirname, "src")
          }
        }
      }
    ]
  },
  plugins: [
    // Each output page needs a HTMLWebpackPlugin entry
    new HTMLWebpackPlugin({
      filename: "index.html",
      template: path.join(__dirname, "src", "lobby.html"),
      // Chunks correspond with the entries you wish to include in your html template
      chunks: ["lobby"]
    }),
    new HTMLWebpackPlugin({
      filename: "room.html",
      template: path.join(__dirname, "src", "room.html"),
      chunks: ["room"],
      inject: "head"
    }),
    new HTMLWebpackPlugin({
      filename: "onboarding.html",
      template: path.join(__dirname, "src", "onboarding.html"),
      chunks: ["onboarding"]
    }),
    // Extract required css and add a content hash.
    new ExtractTextPlugin("[name]-[contenthash].css", {
      disable: process.env.NODE_ENV !== "production"
    }),
    // Transform the output of the html-loader using _.template
    // before passing the result to html-webpack-plugin
    new LodashTemplatePlugin({
      // expose these variables to the lodash template
      // ex: <%= ORIGIN_TRIAL_TOKEN %>
      imports: {
        NODE_ENV: process.env.NODE_ENV,
        ORIGIN_TRIAL_EXPIRES: process.env.ORIGIN_TRIAL_EXPIRES,
        ORIGIN_TRIAL_TOKEN: process.env.ORIGIN_TRIAL_TOKEN
      }
    }),
    // Define process.env variables in the browser context.
    new webpack.DefinePlugin({
      "process.env": JSON.stringify({
        NODE_ENV: process.env.NODE_ENV,
        JANUS_SERVER: process.env.JANUS_SERVER
      })
    })
  ]
};
