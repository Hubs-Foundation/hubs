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
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const TOML = require("@iarna/toml");
const fetch = require("node-fetch");

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
        keySize: 2048,
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

const defaultHostName = "hubs.local";
const host = process.env.HOST_IP || defaultHostName;

function matchRegex({ include, exclude }) {
  return (module, chunks) => {
    if (
      module.nameForCondition &&
      include.test(module.nameForCondition()) &&
      !exclude.test(module.nameForCondition())
    ) {
      return true;
    }
    for (const chunk of chunks) {
      if (chunk.name && include.test(chunk.name) && !exclude.test(chunk.name)) {
        return true;
      }
    }
    return false;
  };
}

const babelConfig = JSON.parse(
  fs
    .readFileSync(path.resolve(__dirname, ".babelrc"))
    .toString()
    .replace(/\/\/.+/g, "")
);

module.exports = async (env, argv) => {
  let appConfig = undefined;
  let appConfigSchema = undefined;

  if (process.env.USE_HUBS_CLOUD_APP_CONFIG) {
    if (!fs.existsSync(".ret.credentials")) {
      throw new Error("Not logged in to Hubs Cloud. Run `npm login` first.");
    }

    const { host, token } = JSON.parse(fs.readFileSync(".ret.credentials"));

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const response = await fetch(`https://${host}/api/v1/app_configs`, { headers });

    if (!response.ok) {
      throw new Error(`Error fetching Hubs Cloud config "${response.statusText}"`);
    }

    appConfig = await response.json();
  } else if (argv.mode === "development") {
    const schemaPath = path.join(__dirname, "src", "schema.toml");
    const schemaString = fs.readFileSync(schemaPath).toString();

    try {
      appConfigSchema = TOML.parse(schemaString);
    } catch (e) {
      console.error("Error parsing schema.toml on line " + e.line + ", column " + e.column + ": " + e.message);
      throw e;
    }
  }

  return {
    node: {
      // need to specify this manually because some random lodash code will try to access
      // Buffer on the global object if it exists, so webpack will polyfill on its behalf
      Buffer: false,
      fs: "empty"
    },
    entry: {
      index: path.join(__dirname, "src", "index.js"),
      hub: path.join(__dirname, "src", "hub.js"),
      scene: path.join(__dirname, "src", "scene.js"),
      avatar: path.join(__dirname, "src", "avatar.js"),
      link: path.join(__dirname, "src", "link.js"),
      discord: path.join(__dirname, "src", "discord.js"),
      cloud: path.join(__dirname, "src", "cloud.js"),
      "whats-new": path.join(__dirname, "src", "whats-new.js")
    },
    output: {
      filename: "assets/js/[name]-[chunkhash].js",
      publicPath: process.env.BASE_ASSETS_PATH || ""
    },
    devtool: argv.mode === "production" ? "source-map" : "inline-source-map",
    devServer: {
      https: createHTTPSConfig(),
      host: "0.0.0.0",
      public: `${host}:8080`,
      useLocalIp: true,
      allowedHosts: [host],
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
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
          // We reference the sources of some libraries directly, and they use async/await,
          // so we have to run it through babel in order to support the Samsung browser on Oculus Go.
          test: [path.resolve(__dirname, "node_modules/naf-janus-adapter")],
          loader: "babel-loader",
          options: babelConfig
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
          use: [
            {
              loader: MiniCssExtractPlugin.loader
            },
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
          test: /\.(svgi)$/,
          use: {
            loader: "svg-inline-loader"
          }
        },
        {
          test: /\.(wasm)$/,
          type: "javascript/auto",
          use: {
            loader: "file-loader",
            options: {
              outputPath: "assets/wasm",
              name: "[name]-[hash].[ext]"
            }
          }
        },
        {
          test: /\.(glsl|frag|vert)$/,
          use: { loader: "raw-loader" }
        }
      ]
    },

    optimization: {
      splitChunks: {
        cacheGroups: {
          vendors: {
            test: matchRegex({
              include: /([\\/]node_modules[\\/]|[\\/]vendor[\\/])/,
              exclude: /[\\/]node_modules[\\/]markdown-it[\\/]/
            }),
            priority: 50,
            name: "vendor",
            chunks: "all"
          },
          engine: {
            test: /([\\/]src[\\/]workers|[\\/]node_modules[\\/](aframe|cannon|three))/,
            priority: 100,
            name: "engine",
            chunks: "all"
          }
        }
      }
    },
    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: env && env.BUNDLE_ANALYZER ? "server" : "disabled"
      }),
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
        filename: "avatar.html",
        template: path.join(__dirname, "src", "avatar.html"),
        chunks: ["vendor", "engine", "avatar"],
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
        chunks: ["vendor", "engine", "link"]
      }),
      new HTMLWebpackPlugin({
        filename: "discord.html",
        template: path.join(__dirname, "src", "discord.html"),
        chunks: ["vendor", "discord"]
      }),
      new HTMLWebpackPlugin({
        filename: "whats-new.html",
        template: path.join(__dirname, "src", "whats-new.html"),
        chunks: ["vendor", "whats-new"],
        inject: "head"
      }),
      new HTMLWebpackPlugin({
        filename: "cloud.html",
        template: path.join(__dirname, "src", "cloud.html"),
        chunks: ["vendor", "cloud"],
        inject: "head"
      }),
      new CopyWebpackPlugin([
        {
          from: "src/hub.service.js",
          to: "hub.service.js"
        }
      ]),
      new CopyWebpackPlugin([
        {
          from: "src/schema.toml",
          to: "schema.toml"
        }
      ]),
      // Extract required css and add a content hash.
      new MiniCssExtractPlugin({
        filename: "assets/stylesheets/[name]-[contenthash].css",
        disable: argv.mode !== "production"
      }),
      // Define process.env variables in the browser context.
      new webpack.DefinePlugin({
        "process.env": JSON.stringify({
          NODE_ENV: argv.mode,
          SHORTLINK_DOMAIN: process.env.SHORTLINK_DOMAIN,
          RETICULUM_SERVER: process.env.RETICULUM_SERVER,
          RETICULUM_SOCKET_SERVER: process.env.RETICULUM_SOCKET_SERVER,
          THUMBNAIL_SERVER: process.env.THUMBNAIL_SERVER,
          CORS_PROXY_SERVER: process.env.CORS_PROXY_SERVER,
          NON_CORS_PROXY_DOMAINS: process.env.NON_CORS_PROXY_DOMAINS,
          BUILD_VERSION: process.env.BUILD_VERSION,
          SENTRY_DSN: process.env.SENTRY_DSN,
          GA_TRACKING_ID: process.env.GA_TRACKING_ID,
          POSTGREST_SERVER: process.env.POSTGREST_SERVER,
          USE_FEATURE_CONFIG: process.env.USE_FEATURE_CONFIG,
          APP_CONFIG: appConfig,
          APP_CONFIG_SCHEMA: appConfigSchema
        })
      })
    ]
  };
};
