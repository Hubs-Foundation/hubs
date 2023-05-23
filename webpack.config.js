const dotenv = require("dotenv");
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
const packageLock = require("./package-lock.json");
const request = require("request");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

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

function getModuleDependencies(moduleName) {
  const deps = packageLock.packages;
  const arr = [];

  const gatherDeps = name => {
    arr.push(path.join(__dirname, "node_modules", name) + path.sep);

    const moduleDef = deps[name];

    if (moduleDef && moduleDef.requires) {
      for (const requiredModuleName in moduleDef.requires) {
        gatherDeps(requiredModuleName);
      }
    }
  };

  gatherDeps(moduleName);

  return arr;
}

function deepModuleDependencyTest(modulesArr) {
  const deps = [];

  for (const moduleName of modulesArr) {
    const moduleDependencies = getModuleDependencies(moduleName);
    deps.push(...moduleDependencies);
  }

  return module => {
    if (!module.nameForCondition) {
      return false;
    }

    const name = module.nameForCondition();

    return deps.some(depName => name?.startsWith(depName));
  };
}

function createDefaultAppConfig() {
  const schemaPath = path.join(__dirname, "src", "schema.toml");
  const schemaString = fs.readFileSync(schemaPath).toString();

  let appConfigSchema;

  try {
    appConfigSchema = TOML.parse(schemaString);
  } catch (e) {
    console.error("Error parsing schema.toml on line " + e.line + ", column " + e.column + ": " + e.message);
    throw e;
  }

  const appConfig = {};

  for (const [categoryName, category] of Object.entries(appConfigSchema)) {
    appConfig[categoryName] = {};

    // Enable all features with a boolean type
    if (categoryName === "features") {
      for (const [key, schema] of Object.entries(category)) {
        if (key === "require_account_for_join" || key === "disable_room_creation") {
          appConfig[categoryName][key] = false;
        } else {
          appConfig[categoryName][key] = schema.type === "boolean" ? true : null;
        }
      }
    }
  }

  const themesPath = path.join(__dirname, "themes.json");

  if (fs.existsSync(themesPath)) {
    const themesString = fs.readFileSync(themesPath).toString();
    const themes = JSON.parse(themesString);
    appConfig.theme.themes = themes;
  }

  return appConfig;
}

async function fetchAppConfigAndEnvironmentVars() {
  const { internalIpV4 } = await import("internal-ip");

  if (!fs.existsSync(".ret.credentials")) {
    throw new Error("Not logged in to Hubs Cloud. Run `npm run login` first.");
  }

  const { host, token } = JSON.parse(fs.readFileSync(".ret.credentials"));

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  // Load the Hubs Cloud instance's app config in development
  const appConfigsResponse = await fetch(`https://${host}/api/v1/app_configs`, { headers });

  if (!appConfigsResponse.ok) {
    throw new Error(`Error fetching Hubs Cloud config "${appConfigsResponse.statusText}"`);
  }

  const appConfig = await appConfigsResponse.json();
  if (appConfig.theme?.themes) {
    appConfig.theme.themes = JSON.parse(appConfig.theme.themes);
  }

  // dev.reticulum.io doesn't run ita
  if (host === "dev.reticulum.io") {
    return appConfig;
  }

  const hubsConfigsResponse = await fetch(`https://${host}/api/ita/configs/hubs`, { headers });

  const hubsConfigs = await hubsConfigsResponse.json();

  if (!hubsConfigsResponse.ok) {
    throw new Error(`Error fetching Hubs Cloud config "${hubsConfigsResponse.statusText}"`);
  }

  const { shortlink_domain, thumbnail_server } = hubsConfigs.general;

  const localIp = process.env.HOST_IP || (await internalIpV4()) || "localhost";

  process.env.RETICULUM_SERVER = host;
  process.env.SHORTLINK_DOMAIN = shortlink_domain;
  process.env.CORS_PROXY_SERVER = `hubs.local:8080/cors-proxy`;
  process.env.THUMBNAIL_SERVER = thumbnail_server;
  process.env.NON_CORS_PROXY_DOMAINS = `${localIp},hubs.local,localhost`;

  return appConfig;
}

function htmlPagePlugin({ filename, extraChunks = [], chunksSortMode, inject }) {
  const chunkName = filename.match(/(.+).html/)[1];
  const options = {
    filename,
    template: path.join(__dirname, "src", filename),
    chunks: [...extraChunks, chunkName],
    // TODO we still have some things that depend on execution order, mostly aframe element API
    scriptLoading: "blocking",
    minify: {
      removeComments: false
    }
  };

  if (chunksSortMode) options.chunksSortMode = chunksSortMode;
  if (inject) options.inject = inject;

  return new HTMLWebpackPlugin(options);
}

const threeExamplesDir = path.resolve(__dirname, "node_modules", "three", "examples");
const basisTranscoderPath = path.resolve(threeExamplesDir, "js", "libs", "basis", "basis_transcoder.js");
const dracoWasmWrapperPath = path.resolve(threeExamplesDir, "js", "libs", "draco", "gltf", "draco_wasm_wrapper.js");
const basisWasmPath = path.resolve(threeExamplesDir, "js", "libs", "basis", "basis_transcoder.wasm");
const dracoWasmPath = path.resolve(threeExamplesDir, "js", "libs", "draco", "gltf", "draco_decoder.wasm");

module.exports = async (env, argv) => {
  env = env || {};

  // Load environment variables from .env files.
  // .env takes precedent over .defaults.env
  // Previously defined environment variables are not overwritten
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".defaults.env" });

  let appConfig = undefined;

  /**
   * Initialize the Webpack build envrionment for the provided environment.
   */

  if (argv.mode !== "production" || env.bundleAnalyzer) {
    if (env.loadAppConfig || process.env.LOAD_APP_CONFIG) {
      if (!env.localDev) {
        // Load and set the app config and environment variables from the remote server.
        // A Hubs Cloud server or dev.reticulum.io can be used.
        appConfig = await fetchAppConfigAndEnvironmentVars();
      }
    } else {
      if (!env.localDev) {
        // Use the default app config with all features enabled.
        appConfig = createDefaultAppConfig();
      }
    }

    if (env.localDev) {
      const localDevHost = "hubs.local";
      // Local Dev Environment (npm run local)
      Object.assign(process.env, {
        HOST: localDevHost,
        RETICULUM_SOCKET_SERVER: localDevHost,
        CORS_PROXY_SERVER: "hubs-proxy.local:4000",
        NON_CORS_PROXY_DOMAINS: `${localDevHost},dev.reticulum.io`,
        BASE_ASSETS_PATH: `https://${localDevHost}:8080/`,
        RETICULUM_SERVER: `${localDevHost}:4000`,
        POSTGREST_SERVER: "",
        ITA_SERVER: "",
        UPLOADS_HOST: `https://${localDevHost}:4000`
      });
    }
  }

  // In production, the environment variables are defined in CI or loaded from ita and
  // the app config is injected into the head of the page by Reticulum.

  const host = process.env.HOST_IP || env.localDev || env.remoteDev ? "hubs.local" : "localhost";

  const liveReload = !!process.env.LIVE_RELOAD || false;

  const devServerHeaders = {
    "Access-Control-Allow-Origin": "*"
  };

  // Behind and environment var for now pending further testing
  if (process.env.DEV_CSP_SOURCE) {
    const CSPResp = await fetch(`https://${process.env.DEV_CSP_SOURCE}/`);
    const remoteCSP = CSPResp.headers.get("content-security-policy");
    devServerHeaders["content-security-policy"] = remoteCSP;
    // .replaceAll("connect-src", "connect-src https://example.com");
  }

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
        // need to specify this manually because some random lodash code will try to access
        // Buffer on the global object if it exists, so webpack will polyfill on its behalf
        Buffer: false,
        fs: false,
        stream: require.resolve("stream-browserify"),
        path: require.resolve("path-browserify")
      },
      extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    entry: {
      support: path.join(__dirname, "src", "support.js"),
      index: path.join(__dirname, "src", "index.js"),
      hub: path.join(__dirname, "src", "hub.js"),
      scene: path.join(__dirname, "src", "scene.js"),
      avatar: path.join(__dirname, "src", "avatar.js"),
      link: path.join(__dirname, "src", "link.js"),
      discord: path.join(__dirname, "src", "discord.js"),
      cloud: path.join(__dirname, "src", "cloud.js"),
      signin: path.join(__dirname, "src", "signin.js"),
      verify: path.join(__dirname, "src", "verify.js"),
      tokens: path.join(__dirname, "src", "tokens.js"),
      "whats-new": path.join(__dirname, "src", "whats-new.js"),
      "webxr-polyfill": path.join(__dirname, "src", "webxr-polyfill.js")
    },
    output: {
      filename: "assets/js/[name]-[chunkhash].js",
      publicPath: process.env.BASE_ASSETS_PATH || ""
    },
    target: ["web", "es5"], // use es5 for webpack runtime to maximize compatibility
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
      host: "0.0.0.0",
      port: 8080,
      allowedHosts: [host, internalHostname],
      headers: devServerHeaders,
      hot: liveReload,
      liveReload: liveReload,
      historyApiFallback: {
        rewrites: [
          { from: /^\/link/, to: "/link.html" },
          { from: /^\/avatars/, to: "/avatar.html" },
          { from: /^\/scenes/, to: "/scene.html" },
          { from: /^\/signin/, to: "/signin.html" },
          { from: /^\/discord/, to: "/discord.html" },
          { from: /^\/cloud/, to: "/cloud.html" },
          { from: /^\/verify/, to: "/verify.html" },
          { from: /^\/tokens/, to: "/tokens.html" },
          { from: /^\/whats-new/, to: "/whats-new.html" }
        ]
      },
      setupMiddlewares: (middlewares, { app }) => {
        // Local CORS proxy
        app.all("/cors-proxy/*", (req, res) => {
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
          res.header("Access-Control-Allow-Headers", "Range");
          res.header(
            "Access-Control-Expose-Headers",
            "Accept-Ranges, Content-Encoding, Content-Length, Content-Range, Hub-Name, Hub-Entity-Type"
          );
          res.header("Vary", "Origin");
          res.header("X-Content-Type-Options", "nosniff");

          const redirectLocation = req.header("location");

          if (redirectLocation) {
            res.header("Location", "https://localhost:8080/cors-proxy/" + redirectLocation);
          }

          if (req.method === "OPTIONS") {
            res.send();
          } else {
            const url = req.originalUrl.replace("/cors-proxy/", "");
            request({ url, method: req.method }, error => {
              if (error) {
                console.error(`cors-proxy: error fetching "${url}"\n`, error);
                return;
              }
            }).pipe(res);
          }
        });

        // be flexible with people accessing via a local reticulum on another port
        app.use(cors({ origin: /hubs\.local(:\d*)?$/ }));
        // networked-aframe makes HEAD requests to the server for time syncing. Respond with an empty body.
        app.head("*", function (req, res, next) {
          if (req.method === "HEAD") {
            res.append("Date", new Date().toGMTString());
            res.send("");
          } else {
            next();
          }
        });

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
            minimize: false, // This is handled by HTMLWebpackPlugin
            sources: {
              list: [
                { tag: "img", attribute: "src", type: "src" },
                { tag: "a-asset-item", attribute: "src", type: "src" },
                { tag: "audio", attribute: "src", type: "src" },
                { tag: "source", attribute: "src", type: "src" }
              ]
            }
          }
        },
        // On legacy browsers we want to show a "unsupported browser" page. That page needs to run on older browsers so w set the targeet to ie11.
        // Note: We do not actually include any polyfills so the code in these files just needs to be written with bare minimum browser APIs
        {
          test: [
            path.resolve(__dirname, "src", "utils", "configs.js"),
            path.resolve(__dirname, "src", "utils", "i18n.js"),
            path.resolve(__dirname, "src", "support.js")
          ],
          loader: "babel-loader",
          options: {
            presets: ["@babel/react", ["@babel/env", { targets: { ie: 11 } }]],
            plugins: require("./babel.config").plugins
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
          test: /\.js$/,
          include: [path.resolve(__dirname, "src")],
          // Exclude JS assets in node_modules because they are already transformed and often big.
          exclude: [path.resolve(__dirname, "node_modules")],
          loader: "babel-loader"
        },
        // pdfjs uses features that break in IOS14, so we want to run it through babel https://github.com/mozilla/pdf.js/issues/14327
        // TODO remove when iOS 16 is out as we support last 2 major versions in our .browserslistrc so this will become a noop in terms of fixing that error
        {
          test: /\.js$/,
          include: [path.resolve(__dirname, "node_modules", "pdfjs-dist")],
          loader: "babel-loader"
        },
        {
          // We use babel to handle typescript so that features are correctly polyfilled for our targeted browsers. It also ends up being
          // a good deal faster since it just strips out types. It does NOT typecheck. Typechecking is handled at build time by `npm run check`
          // and concurrently at dev time with ForkTsCheckerWebpackPlugin
          test: /\.tsx?$/,
          include: [path.resolve(__dirname, "src")],
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
          test: /\.svg$/,
          include: [path.resolve(__dirname, "src", "react-components")],
          use: [
            {
              loader: "@svgr/webpack",
              options: {
                titleProp: true,
                replaceAttrValues: { "#000": "currentColor" },
                exportType: "named",
                svgo: true,
                svgoConfig: {
                  plugins: [
                    {
                      name: "preset-default",
                      params: {
                        overrides: {
                          removeViewBox: false,
                          mergePaths: false,
                          convertShapeToPath: false,
                          removeHiddenElems: false
                        }
                      }
                    }
                  ]
                }
              }
            }
          ]
        },
        {
          oneOf: [
            { resourceQuery: /inline/, type: "asset/inline" },
            {
              test: /\.(png|jpg|gif|glb|ogg|mp3|mp4|wav|woff2|webm|3dl|cube)$/,
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
                  return rootPath + "[name]-[contenthash].[ext]";
                }
              }
            }
          ]
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
        },
        {
          test: /\.(glsl|frag|vert)$/,
          use: { loader: "raw-loader" }
        }
      ]
    },
    optimization: {
      splitChunks: {
        maxAsyncRequests: 10,
        maxInitialRequests: 10,
        cacheGroups: {
          frontend: {
            test: deepModuleDependencyTest([
              "react",
              "react-dom",
              "prop-types",
              "raven-js",
              "react-intl",
              "classnames",
              "react-router",
              "@fortawesome/fontawesome-svg-core",
              "@fortawesome/free-solid-svg-icons",
              "@fortawesome/react-fontawesome"
            ]),
            name: "frontend",
            chunks: "initial",
            priority: 40
          },
          engine: {
            test: deepModuleDependencyTest(["aframe", "three"]),
            name: "engine",
            chunks: "initial",
            priority: 30
          },
          store: {
            test: deepModuleDependencyTest(["phoenix", "jsonschema", "event-target-shim", "jwt-decode", "js-cookie"]),
            name: "store",
            chunks: "initial",
            priority: 20
          },
          hubVendors: {
            test: /[\\/]node_modules[\\/]/,
            name: "hub-vendors",
            chunks: chunk => chunk.name === "hub",
            priority: 10
          }
        }
      }
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          diagnosticOptions: {
            semantic: true,
            syntactic: false // this will already fail in the babel step
          }
        }
      }),
      new webpack.ProvidePlugin({
        process: "process/browser",
        // TODO we should bee direclty importing THREE stuff when we need it
        THREE: "three"
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: env && env.bundleAnalyzer ? "server" : "disabled"
      }),
      // Each output page needs a HTMLWebpackPlugin entry
      htmlPagePlugin({
        filename: "index.html",
        extraChunks: ["support"],
        chunksSortMode: "manual"
      }),
      htmlPagePlugin({
        filename: "hub.html",
        extraChunks: ["webxr-polyfill", "support"],
        chunksSortMode: "manual",
        inject: "head"
      }),
      htmlPagePlugin({
        filename: "scene.html",
        extraChunks: ["support"],
        chunksSortMode: "manual",
        inject: "head"
      }),
      htmlPagePlugin({
        filename: "avatar.html",
        extraChunks: ["support"],
        chunksSortMode: "manual",
        inject: "head"
      }),
      htmlPagePlugin({
        filename: "link.html",
        extraChunks: ["support"],
        chunksSortMode: "manual"
      }),
      htmlPagePlugin({
        filename: "discord.html"
      }),
      htmlPagePlugin({
        filename: "whats-new.html",
        inject: "head"
      }),
      htmlPagePlugin({
        filename: "cloud.html",
        inject: "head"
      }),
      htmlPagePlugin({
        filename: "signin.html"
      }),
      htmlPagePlugin({
        filename: "verify.html"
      }),
      htmlPagePlugin({
        filename: "tokens.html"
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "src/hub.service.js",
            to: "hub.service.js"
          }
        ]
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "src/schema.toml",
            to: "schema.toml"
          }
        ]
      }),
      // Extract required css and add a content hash.
      new MiniCssExtractPlugin({
        filename: "assets/stylesheets/[name]-[contenthash].css"
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
          UPLOADS_HOST: process.env.UPLOADS_HOST,
          BASE_ASSETS_PATH: process.env.BASE_ASSETS_PATH,
          APP_CONFIG: appConfig
        })
      })
    ]
  };
};
