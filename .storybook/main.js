const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const themesPath = path.resolve(__dirname, "..", "themes.json");
if (fs.existsSync(themesPath)) {
  const appConfig = {};
  const themesString = fs.readFileSync(themesPath).toString();
  appConfig.theme = {};
  appConfig.theme.themes = JSON.parse(themesString);
  process.env.STORYBOOK_APP_CONFIG = JSON.stringify(appConfig);
}
module.exports = {
  stories: ["../src/react-components/**/*.stories.mdx", "../src/react-components/**/*.stories.js"],
  addons: ["@storybook/addon-links", "@storybook/addon-docs"],
  webpackFinal: async config => {
    // Add explicit babel-loader rule for JS files with JSX at the beginning
    config.module.rules.unshift({
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: "babel-loader",
        options: {
          presets: [
            ["@babel/preset-env", { targets: "defaults" }],
            ["@babel/preset-react", { runtime: "automatic" }]
          ],
          plugins: [
            "formatjs",
            ["@babel/plugin-proposal-private-property-in-object", { loose: true }],
            ["@babel/plugin-proposal-private-methods", { loose: true }]
          ]
        }
      }
    });

    // Find and update the existing babel rule to handle JSX properly
    const jsRule = config.module.rules.find(
      rule => rule.test && rule.test.toString().includes("js") && !rule.test.toString().includes("node_modules")
    );

    if (jsRule) {
      // Make sure it handles .js files with JSX
      jsRule.test = /\.(js|jsx|ts|tsx)$/;
      if (jsRule.use && Array.isArray(jsRule.use)) {
        const babelLoader = jsRule.use.find(
          loader => typeof loader === "object" && loader.loader && loader.loader.includes("babel")
        );
        if (babelLoader && babelLoader.options) {
          // Ensure React preset is configured for JSX
          babelLoader.options.presets = babelLoader.options.presets || [];
          const hasReactPreset = babelLoader.options.presets.some(preset =>
            Array.isArray(preset) ? preset[0].includes("react") : preset.includes("react")
          );
          if (!hasReactPreset) {
            babelLoader.options.presets.push(["@babel/preset-react", { runtime: "automatic" }]);
          }
        }
      }
    }

    config.module.rules.push({
      test: /\.scss$/,
      use: [
        "style-loader",
        {
          loader: "css-loader",
          options: {
            modules: {
              localIdentName: "[name]__[local]__[hash:base64:5]",
              exportLocalsConvention: "camelCase",
              // TODO we ideally would be able to get rid of this but we have some global styles and many :local's that would become superfluous
              mode: "global",
              // Restore default export behavior for css-loader 7 compatibility
              namedExport: false,
              exportOnlyLocals: false
            }
          }
        },
        "sass-loader"
      ],
      include: path.resolve(__dirname, "..", "src")
    });
    const fileLoaderRule = config.module.rules.find(rule => rule.test.test(".svg"));
    fileLoaderRule.exclude = /\.svg$/;
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            titleProp: true,
            replaceAttrValues: {
              "#000": "currentColor"
            },
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
    });
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      use: ["file-loader"],
      include: path.resolve(__dirname, "../")
    });

    // Add DefinePlugin to provide process.env variables
    config.plugins.push(
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: JSON.stringify("development"),
          RETICULUM_SERVER: JSON.stringify(""),
          THUMBNAIL_SERVER: JSON.stringify(""),
          CORS_PROXY_SERVER: JSON.stringify(""),
          NON_CORS_PROXY_DOMAINS: JSON.stringify(""),
          SENTRY_DSN: JSON.stringify(""),
          GA_TRACKING_ID: JSON.stringify(""),
          SHORTLINK_DOMAIN: JSON.stringify(""),
          BASE_ASSETS_PATH: JSON.stringify(""),
          UPLOADS_HOST: JSON.stringify(""),
          APP_CONFIG: JSON.stringify("")
        }
      })
    );

    return config;
  },
  framework: {
    name: "@storybook/react-webpack5",
    options: {}
  },
  babel: async options => {
    return {
      ...options,
      presets: [...options.presets, ["@babel/preset-react", { runtime: "automatic" }]]
    };
  }
};
