const path = require("path");
const webpack = require("webpack");

module.exports = {
  stories: ["../src/react-components/**/*.stories.mdx", "../src/react-components/**/*.stories.js", "../stories/**/*.stories.js"],
  addons: ["@storybook/addon-links", "@storybook/addon-docs"],
  staticDirs: ["../src/assets", "./static"],
  webpackFinal: async config => {
    // Improve stack traces: use high-quality source maps in dev, full source maps in build
    config.devtool = config.mode === "development" ? "eval-source-map" : "source-map";

    // Name chunks/modules for more readable stacks
    config.optimization = {
      ...config.optimization,
      moduleIds: "named",
      chunkIds: "named"
    };

    // Make sure source maps point to real files
    config.output = {
      ...config.output,
      devtoolModuleFilenameTemplate: info => {
        // Prefer absolute paths for better mapping in Chrome/Playwright logs
        return `webpack:///${info.resourcePath}`;
      }
    };

    // Add explicit babel-loader rule for JS/JSX/TS/TSX files at the beginning
    config.module.rules.unshift({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: "babel-loader",
        options: {
          sourceMaps: true,
          presets: [
            ["@babel/preset-env", { targets: "defaults" }],
            ["@babel/preset-react", { runtime: "automatic" }],
            "@babel/preset-typescript"
          ],
          plugins: [
            "formatjs",
            ["@babel/plugin-proposal-private-property-in-object", { loose: true }],
            ["@babel/plugin-proposal-private-methods", { loose: true }]
          ]
        }
      }
    });

    // Add SCSS support for admin styles
    config.module.rules.push({
      test: /\.scss$/,
      use: [
        "style-loader",
        {
          loader: "css-loader",
          options: {
            modules: false // Admin uses global styles
          }
        },
        "sass-loader"
      ],
      include: [
        path.resolve(__dirname, "..", "src"),
        path.resolve(__dirname, "..", "..", "src") // Access main hubs styles if needed
      ]
    });

    // Handle SVG files
    const fileLoaderRule = config.module.rules.find(rule => rule.test && rule.test.test && rule.test.test(".svg"));
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/;
    }
    
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack", "url-loader"]
    });

    // Handle other asset files - exclude PNG from file-loader to use static assets instead
    config.module.rules.push({
      test: /\.(jpg|jpeg|gif|ico)$/,
      use: ["file-loader"],
      include: path.resolve(__dirname, "../")
    });

    // Add DefinePlugin to provide process.env variables for admin
    config.plugins.push(
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: JSON.stringify("development"),
          RETICULUM_SERVER: JSON.stringify(""),
          POSTGREST_SERVER: JSON.stringify(""),
          ITA_SERVER: JSON.stringify(""),
          BASE_ASSETS_PATH: JSON.stringify(""),
          STORYBOOK_APP_CONFIG: JSON.stringify("")
        }
      })
    );

    // Resolve admin node_modules and parent node_modules
    config.resolve.modules = [
      path.resolve(__dirname, "..", "node_modules"),
      path.resolve(__dirname, "..", "..", "node_modules"),
      "node_modules"
    ];

    // Mock problematic modules for Storybook
    config.resolve.alias = {
      ...config.resolve.alias,
      "../utils/configs": path.resolve(__dirname, "mocks", "configs.js"),
      "./configs": path.resolve(__dirname, "mocks", "configs.js"),
      "../utils/ita": path.resolve(__dirname, "mocks", "ita.js"),
      "./ita": path.resolve(__dirname, "mocks", "ita.js"),
      "../utils/feature_flags": path.resolve(__dirname, "mocks", "feature_flags.js"),
      "./feature_flags": path.resolve(__dirname, "mocks", "feature_flags.js")
    };

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
