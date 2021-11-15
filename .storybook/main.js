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
  addons: ["@storybook/addon-links", "@storybook/addon-essentials", "storybook-addon-designs"],
  webpackFinal: async config => {
    config.module.rules.push({
      test: /\.scss$/,
      use: [
        "style-loader",
        {
          loader: "css-loader",
          options: {
            importLoaders: "1",
            localIdentName: "[name]__[local]___[hash:base64:5]",
            modules: true,
            camelCase: true
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
            replaceAttrValues: { "#000": "{props.color}" },
            template: require("../src/react-components/icons/IconTemplate"),
            svgoConfig: {
              plugins: {
                removeViewBox: false,
                mergePaths: false,
                convertShapeToPath: false,
                removeHiddenElems: false
              }
            }
          }
        },
        "url-loader"
      ]
    });

    return config;
  }
};
