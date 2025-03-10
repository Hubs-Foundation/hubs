const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const selfsigned = require("selfsigned");
const webpack = require("webpack");
const cors = require("cors");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

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

const threeExamplesDir = path.resolve(__dirname, "node_modules", "three", "examples");
const basisTranscoderPath = path.resolve(threeExamplesDir, "js", "libs", "basis", "basis_transcoder.js");
const dracoWasmWrapperPath = path.resolve(threeExamplesDir, "js", "libs", "draco", "gltf", "draco_wasm_wrapper.js");
const basisWasmPath = path.resolve(threeExamplesDir, "js", "libs", "basis", "basis_transcoder.wasm");
const dracoWasmPath = path.resolve(threeExamplesDir, "js", "libs", "draco", "gltf", "draco_decoder.wasm");

module.exports = (env, argv) => {
  env = env || {};

  // Load environment variables from .env files.
  // .env takes precedent over .defaults.env
  // Previously defined environment variables are not overwritten
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".defaults.env" });

  if (env.local) {
    Object.assign(process.env, {
      HOST: "hubs.local",
      RETICULUM_SOCKET_SERVER: "hubs.local",
      CORS_PROXY_SERVER: "hubs-proxy.local:4000",
      NON_CORS_PROXY_DOMAINS: "hubs.local,dev.reticulum.io",
      BASE_ASSETS_PATH: "https://hubs.local:8989/",
      RETICULUM_SERVER: "hubs.local:4000",
      POSTGREST_SERVER: "",
      ITA_SERVER: "turkey",
      TIER: "p1"
    });
  }

  const defaultHostName = "hubs.local";
  const host = process.env.HOST_IP || defaultHostName;

  const internalHostname = process.env.INTERNAL_HOSTNAME || "hubs.local";
  return {
    cache: {
      type: "filesystem"
    },
    resolve: {
      alias: {
        // aframe and networked-aframe are still using commonjs modules. three and bitecs are peer dependanciees
        // but they are "smart" and have builds for both ESM and CJS depending on if import or require is used.
        // This forces the ESM version to be used otherwise we end up with multiple instances of the libraries,
        // and for example AFRAME.THREE.Object3D !== THREE.Object3D in Hubs code, which breaks many things.
        three$: path.resolve(__dirname, "./node_modules/three/build/three.module.js"),
        bitecs$: path.resolve(__dirname, "./node_modules/bitecs/dist/index.mjs"),

        // TODO these aliases are reequired because `three` only "exports" stuff in examples/jsm
        "three/examples/js/libs/basis/basis_transcoder.js": basisTranscoderPath,
        "three/examples/js/libs/draco/gltf/draco_wasm_wrapper.js": dracoWasmWrapperPath,
        "three/examples/js/libs/basis/basis_transcoder.wasm": basisWasmPath,
        "three/examples/js/libs/draco/gltf/draco_decoder.wasm": dracoWasmPath
      },
      // Allows using symlinks in node_modules
      symlinks: false,
      fallback: {
        fs: false,
        buffer: require.resolve("buffer/"),
        stream: require.resolve("stream-browserify"),
        path: require.resolve("path-browserify")
      },
      extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    entry: {
      admin: path.join(__dirname, "src", "admin.js")
    },
    output: {
      filename: "assets/js/[name]-[chunkhash].js",
      publicPath: process.env.BASE_ASSETS_PATH || ""
    },
    devtool: argv.mode === "production" ? "source-map" : "inline-source-map",
    devServer: {
      client: {
        overlay: {
          errors: true,
          warnings: false
        }
      },
      server: {
        type: "https",
        options: createHTTPSConfig()
      },
      host: process.env.HOST_IP || "0.0.0.0",
      port: process.env.PORT || "8989",
      allowedHosts: [host, internalHostname],
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      setupMiddlewares: (middlewares, { app }) => {
        // be flexible with people accessing via a local reticulum on another port
        app.use(cors({ origin: /hubs\.local(:\d*)?$/ }));
        return middlewares;
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
            minimize: false // This is handled by HTMLWebpackPlugin
          }
        },
        // Some JS assets are loaded at runtime and should be copied unmodified and loaded using file-loader
        {
          test: [basisTranscoderPath, dracoWasmWrapperPath],
          loader: "file-loader",
          options: {
            outputPath: "assets/raw-js",
            name: "[name]-[contenthash].[ext]"
          }
        },
        {
          test: /\.js$/,
          loader: "babel-loader",
          options: require("../babel.config"),
          exclude: function (modulePath) {
            return /node_modules/.test(modulePath) && !/node_modules\/hubs/.test(modulePath);
          }
        },
        {
          // We use babel to handle typescript so that features are correctly polyfilled for our targeted browsers. It also ends up being
          // a good deeal faster since it just strips out types. It does NOT typecheck. Typechecking is only done at build and (ideally) in your editor.
          test: /\.tsx?$/,
          loader: "babel-loader",
          options: require("../babel.config"),
          exclude: function (modulePath) {
            return /node_modules/.test(modulePath) && !/node_modules\/hubs/.test(modulePath);
          }
        },
        // TODO worker-loader has been deprecated, but we need "inline" support which is not available yet
        // ideally instead of inlining workers we should serve them off the root domain instead of CDN.
        {
          test: /\.worker\.js$/,
          loader: "worker-loader",
          options: {
            filename: "assets/js/[name]-[contenthash].js",
            publicPath: "/",
            inline: "no-fallback"
          }
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
                modules: {
                  localIdentName: "[name]__[local]__[hash:base64:5]",
                  exportLocalsConvention: "camelCase",
                  // TODO we ideally would be able to get rid of this but we have some global styles and many :local's that would become superfluous
                  mode: "global"
                }
              }
            },
            "sass-loader"
          ]
        },
        {
          test: /\.(glsl|frag|vert)$/,
          use: { loader: "raw-loader" }
        },
        {
          test: /\.(png|jpg|gif|glb|ogg|mp3|mp4|wav|woff2|webm)$/,
          type: "asset/resource",
          generator: {
            // move required assets to output dir and add a hash for cache busting
            // Make asset paths relative to /src
            filename: function ({ filename }) {
              let rootPath = path.dirname(filename) + path.sep;
              if (rootPath.startsWith("src" + path.sep)) {
                const parts = rootPath.split(path.sep);
                parts.shift();
                rootPath = parts.join(path.sep);
              }

              if (rootPath.startsWith("node_modules" + path.sep + "hubs" + path.sep + "src" + path.sep)) {
                const parts = rootPath.split(path.sep);
                parts.shift();
                parts.shift();
                parts.shift();
                rootPath = parts.join(path.sep);
              }
              // console.log(path, name, contenthash, ext);
              return rootPath + "[name]-[contenthash].[ext]";
            }
          }
        },
        {
          test: /\.(wasm)$/,
          type: "javascript/auto",
          use: {
            loader: "file-loader",
            options: {
              outputPath: "assets/wasm",
              name: "[name]-[contenthash].[ext]"
            }
          }
        }
      ]
    },
    plugins: [
      new webpack.ProvidePlugin({
        // TODO we should bee direclty importing THREE stuff when we need it
        process: "process/browser",
        THREE: "three",
        Buffer: ["buffer", "Buffer"]
      }),
      new HTMLWebpackPlugin({
        filename: "admin.html",
        template: path.join(__dirname, "src", "admin.html"),
        scriptLoading: "blocking",
        minify: {
          removeComments: false
        }
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "src/assets/images/favicon.ico",
            to: "favicon.ico"
          }
        ]
      }),
      // Extract required css and add a content hash.
      new MiniCssExtractPlugin({
        filename: "assets/stylesheets/[name]-[contenthash].css"
      }),
      // Define process.env variables in the browser context.
      new webpack.DefinePlugin({
        "process.browser": true,
        "process.env": JSON.stringify({
          DISABLE_BRANDING: process.env.DISABLE_BRANDING,
          NODE_ENV: argv.mode,
          BUILD_VERSION: process.env.BUILD_VERSION,
          CONFIGURABLE_SERVICES: process.env.CONFIGURABLE_SERVICES,
          ITA_SERVER: process.env.ITA_SERVER,
          TIER: process.env.TIER,
          RETICULUM_SERVER: process.env.RETICULUM_SERVER,
          CORS_PROXY_SERVER: process.env.CORS_PROXY_SERVER,
          POSTGREST_SERVER: process.env.POSTGREST_SERVER,
          UPLOADS_HOST: process.env.UPLOADS_HOST,
          BASE_ASSETS_PATH: process.env.BASE_ASSETS_PATH
        })
      })
    ]
  };
};
