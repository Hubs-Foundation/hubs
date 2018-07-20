// Variables in .env will be added to process.env
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const selfsigned = require("selfsigned");
const webpack = require("webpack");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const _ = require("lodash");

const SMOKE_PREFIX = "smoke-";

function createHTTPSConfig() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

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
              },
              {
                type: 2,
                value: "hubs.local"
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
      key: pems.private,
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

const config = {
  entry: {
    index: path.join(__dirname, "src", "index.js"),
    hub: path.join(__dirname, "src", "hub.js"),
    link: path.join(__dirname, "src", "link.js"),
    "avatar-selector": path.join(__dirname, "src", "avatar-selector.js")
  },
  output: {
    path: path.join(__dirname, "public"),
    filename: "assets/js/[name]-[chunkhash].js",
    publicPath: process.env.BASE_ASSETS_PATH || ""
  },
  mode: "development",
  devtool: process.env.NODE_ENV === "production" ? "source-map" : "inline-source-map",
  devServer: {
    open: false,
    https: createHTTPSConfig(),
    host: "0.0.0.0",
    useLocalIp: true,
    public: "hubs.local:8080",
    port: 8080,
    headers: { "Access-Control-Allow-Origin": "*" },
    before: function(app) {
      // networked-aframe makes HEAD requests to the server for time syncing. Respond with an empty body.
      app.head("*", function(req, res, next) {
        if (req.method === "HEAD") {
          res.append("Date", new Date().toGMTString());
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
      return !/\.(map|png|jpg|gif|glb|webm)$/.test(assetFilename);
    }
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: "html-loader",
        options: {
          // <a-asset-item>'s src property is overwritten with the correct transformed asset url.
          attrs: ["img:src", "a-asset-item:src", "audio:src", "source:src"],
          // You can get transformed asset urls in an html template using ${require("pathToFile.ext")}
          interpolate: "require"
        }
      },
      {
        test: /\.worker\.js$/,
        loader: "worker-loader",
        options: {
          name: "assets/js/[name]-[hash].js",
          publicPath: "/"
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
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: [
            {
              loader: "css-loader",
              options: {
                name: "[path][name]-[hash].[ext]",
                minimize: process.env.NODE_ENV === "production",
                localIdentName: "[name]__[local]__[hash:base64:5]",
                camelCase: true
              }
            },
            "sass-loader"
          ]
        })
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: {
            loader: "css-loader",
            options: {
              name: "[path][name]-[hash].[ext]",
              minimize: process.env.NODE_ENV === "production",
              localIdentName: "[name]__[local]__[hash:base64:5]",
              camelCase: true
            }
          }
        })
      },
      {
        test: /\.(png|jpg|gif|glb|ogg|mp3|mp4|wav|woff2|svg|webm)$/,
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
  // necessary due to https://github.com/visionmedia/debug/issues/547
  optimization: {
    minimizer: [new UglifyJsPlugin({ uglifyOptions: { compress: { collapse_vars: false } } })]
  },
  plugins: [
    // Each output page needs a HTMLWebpackPlugin entry
    new HTMLWebpackPlugin({
      filename: "index.html",
      template: path.join(__dirname, "src", "index.html"),
      // Chunks correspond with the entries you wish to include in your html template
      chunks: ["index"]
    }),
    new HTMLWebpackPlugin({
      filename: "hub.html",
      template: path.join(__dirname, "src", "hub.html"),
      chunks: ["hub"],
      inject: "head"
    }),
    new HTMLWebpackPlugin({
      filename: "link.html",
      template: path.join(__dirname, "src", "link.html"),
      chunks: ["link"]
    }),
    new HTMLWebpackPlugin({
      filename: "avatar-selector.html",
      template: path.join(__dirname, "src", "avatar-selector.html"),
      chunks: ["avatar-selector"],
      inject: "head"
    }),
    new CopyWebpackPlugin([
      {
        from: "src/assets/images/favicon.ico",
        to: "favicon.ico"
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: "src/assets/images/hub-preview.png",
        to: "hub-preview.png"
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: "src/assets/avatars/bot-recording.json",
        to: "assets/avatars/bot-recording.json"
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: "src/assets/avatars/bot-recording.mp3",
        to: "assets/avatars/bot-recording.mp3"
      }
    ]),
    // Extract required css and add a content hash.
    new ExtractTextPlugin({
      filename: "assets/stylesheets/[name]-[contenthash].css",
      disable: process.env.NODE_ENV !== "production"
    }),
    // Transform the output of the html-loader using _.template
    // before passing the result to html-webpack-plugin
    new LodashTemplatePlugin({
      // expose these variables to the lodash template
      // ex: <%= ORIGIN_TRIAL_TOKEN %>
      imports: {
        HTML_PREFIX: process.env.GENERATE_SMOKE_TESTS ? SMOKE_PREFIX : "",
        NODE_ENV: process.env.NODE_ENV,
        ORIGIN_TRIAL_EXPIRES: process.env.ORIGIN_TRIAL_EXPIRES,
        ORIGIN_TRIAL_TOKEN: process.env.ORIGIN_TRIAL_TOKEN
      }
    }),
    // Define process.env variables in the browser context.
    new webpack.DefinePlugin({
      "process.env": JSON.stringify({
        NODE_ENV: process.env.NODE_ENV,
        JANUS_SERVER: process.env.JANUS_SERVER,
        DEV_RETICULUM_SERVER: process.env.DEV_RETICULUM_SERVER,
        ASSET_BUNDLE_SERVER: process.env.ASSET_BUNDLE_SERVER,
        BUILD_VERSION: process.env.BUILD_VERSION
      })
    })
  ]
};

module.exports = () => {
  if (process.env.GENERATE_SMOKE_TESTS && process.env.BASE_ASSETS_PATH) {
    const smokeConfig = Object.assign({}, config, {
      // Set the public path for to point to the correct assets on the smoke-test build.
      output: Object.assign({}, config.output, {
        publicPath: process.env.BASE_ASSETS_PATH.replace("://", `://${SMOKE_PREFIX}`)
      }),
      // For this config
      plugins: config.plugins.map(plugin => {
        if (plugin instanceof HTMLWebpackPlugin) {
          return new HTMLWebpackPlugin(
            Object.assign({}, plugin.options, {
              filename: SMOKE_PREFIX + plugin.options.filename
            })
          );
        }

        return plugin;
      })
    });

    return [config, smokeConfig];
  } else {
    return config;
  }
};
