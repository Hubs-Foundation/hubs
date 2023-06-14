const path = require("path");
const fs = require("fs");
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
  addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
  webpackFinal: async config => {
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
              mode: "global"
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
    return config;
  },
  framework: {
    name: "@storybook/react-webpack5",
    options: {}
  }
};
