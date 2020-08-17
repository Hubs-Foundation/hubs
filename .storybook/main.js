const path = require("path");

module.exports = {
  stories: ["../src/react-components/**/*.stories.mdx", "../src/react-components/**/*.stories.js"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials", "storybook-addon-designs"],
  webpackFinal: async config => {
    config.module.rules.push({
      test: /\.scss$/,
      use: ["style-loader", "css-loader", "sass-loader"],
      include: path.resolve(__dirname, "..", "src")
    });

    return config;
  }
};
