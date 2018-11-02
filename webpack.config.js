// Variables in .env and .env.defaults will be added to process.env
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.defaults" });

const fs = require("fs");
const path = require("path");
const selfsigned = require("selfsigned");
const webpack = require("webpack");
const cors = require("cors");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

function createHTTPSConfig() {
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

module.exports = (env, argv) => ({
  entry: {
    index: path.join(__dirname, "src", "index.js"),
    hub: path.join(__dirname, "src", "hub.js"),
    scene: path.join(__dirname, "src", "scene.js"),
    link: path.join(__dirname, "src", "link.js"),
    spoke: path.join(__dirname, "src", "spoke.js"),
    "avatar-selector": path.join(__dirname, "src", "avatar-selector.js")
  },
  output: {
    filename: "assets/js/[name]-[chunkhash].js",
    publicPath: process.env.BASE_ASSETS_PATH || ""
  },
  devtool: argv.mode === "production" ? "source-map" : "inline-source-map",
  devServer: {
    https: createHTTPSConfig(),
    host: "0.0.0.0",
    public: "hubs.local:8080",
    useLocalIp: true,
    allowedHosts: ["hubs.local"],
    before: function(app) {
      // be flexible with people accessing via a local reticulum on another port
      app.use(cors({ origin: /hubs\.local(:\d*)?$/ }));
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
          attrs: ["img:src", "a-asset-item:src", "audio:src", "source:src"]
        }
      },
      {
        test: /\.worker\.js$/,
        loader: "worker-loader",
        options: {
          name: "assets/js/[name]-[hash].js",
          publicPath: "/",
          inline: true
        }
      },
      {
        test: /\.js$/,
        include: [path.resolve(__dirname, "src")],
        // Exclude JS assets in node_modules because they are already transformed and often big.
        exclude: [path.resolve(__dirname, "node_modules")],
        loader: "babel-loader"
      },
      {
        test: /\.(scss|css)$/,
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: [
            {
              loader: "css-loader",
              options: {
                name: "[path][name]-[hash].[ext]",
                localIdentName: "[name]__[local]__[hash:base64:5]",
                camelCase: true
              }
            },
            "sass-loader"
          ]
        })
      },
      {
        test: /\.(png|jpg|gif|glb|ogg|mp3|mp4|wav|woff2|svg|webm)$/,
        use: {
          loader: "file-loader",
          options: {
            // move required assets to output dir and add a hash for cache busting
            name: "[path][name]-[hash].[ext]",
            // Make asset paths relative to /src
            context: path.join(__dirname, "src")
          }
        }
      },
      {
        test: /\.(glsl)$/,
        use: { loader: "raw-loader" }
      }
    ]
  },

  optimization: {
    // necessary due to https://github.com/visionmedia/debug/issues/547
    minimizer: [new UglifyJsPlugin({ sourceMap: true, uglifyOptions: { compress: { collapse_vars: false } } })],
    splitChunks: {
      cacheGroups: {
        engine: {
          test: /([\\/]src[\\/]workers|[\\/]node_modules[\\/](aframe|cannon|three\.js))/,
          priority: 100,
          name: "engine",
          chunks: "all"
        },
        vendors: {
          test: /([\\/]node_modules[\\/]|[\\/]vendor[\\/])/,
          priority: 50,
          name: "vendor",
          chunks: "all"
        }
      }
    }
  },
  plugins: [
    // Each output page needs a HTMLWebpackPlugin entry
    new HTMLWebpackPlugin({
      filename: "index.html",
      template: path.join(__dirname, "src", "index.html"),
      chunks: ["vendor", "index"]
    }),
    new HTMLWebpackPlugin({
      filename: "hub.html",
      template: path.join(__dirname, "src", "hub.html"),
      chunks: ["vendor", "engine", "hub"],
      inject: "head",
      meta: [
        {
          "http-equiv": "origin-trial",
          "data-feature": "WebVR (For Chrome M62+)",
          "data-expires": process.env.ORIGIN_TRIAL_EXPIRES,
          content: process.env.ORIGIN_TRIAL_TOKEN
        }
      ]
    }),
    new HTMLWebpackPlugin({
      filename: "scene.html",
      template: path.join(__dirname, "src", "scene.html"),
      chunks: ["vendor", "engine", "scene"],
      inject: "head",
      meta: [
        {
          "http-equiv": "origin-trial",
          "data-feature": "WebVR (For Chrome M62+)",
          "data-expires": process.env.ORIGIN_TRIAL_EXPIRES,
          content: process.env.ORIGIN_TRIAL_TOKEN
        }
      ]
    }),
    new HTMLWebpackPlugin({
      filename: "link.html",
      template: path.join(__dirname, "src", "link.html"),
      chunks: ["vendor", "link"]
    }),
    new HTMLWebpackPlugin({
      filename: "spoke.html",
      template: path.join(__dirname, "src", "spoke.html"),
      chunks: ["vendor", "spoke"]
    }),
    new HTMLWebpackPlugin({
      filename: "avatar-selector.html",
      template: path.join(__dirname, "src", "avatar-selector.html"),
      chunks: ["vendor", "engine", "avatar-selector"],
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
        from: "src/hub.service.js",
        to: "hub.service.js"
      }
    ]),
    // Extract required css and add a content hash.
    new ExtractTextPlugin({
      filename: "assets/stylesheets/[name]-[md5:contenthash:hex:20].css",
      disable: argv.mode !== "production"
    }),
    // Define process.env variables in the browser context.
    new webpack.DefinePlugin({
      "process.env": JSON.stringify({
        NODE_ENV: argv.mode,
        JANUS_SERVER: process.env.JANUS_SERVER,
        RETICULUM_SERVER: process.env.RETICULUM_SERVER,
        FARSPARK_SERVER: process.env.FARSPARK_SERVER,
        ASSET_BUNDLE_SERVER: process.env.ASSET_BUNDLE_SERVER,
        EXTRA_ENVIRONMENTS: process.env.EXTRA_ENVIRONMENTS,
        BUILD_VERSION: process.env.BUILD_VERSION
      })
    })
  ]
});
