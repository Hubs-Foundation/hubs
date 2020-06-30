import React from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { IntlProvider, addLocaleData } from "react-intl";
import registerTelemetry from "./telemetry";
import "./utils/theme";
import { HomePage } from "./react-components/home/HomePage";
import { lang, messages } from "./utils/i18n";
import configs from "./utils/configs";
import en from "react-intl/locale-data/en";
import "@hubs/npm-externals";
import Hubs from "@hubs/core";
import "@hubs/react";
import "@hubs/home-page";
import "@hubs/media-browser";

addLocaleData([...en]);
registerTelemetry("/home", "Hubs Home Page");
window.APP = { store: Hubs.store };

function Root({ component: HomePageComponent }) {
  return (
    <IntlProvider locale={lang} messages={messages}>
      <HomePageComponent />
    </IntlProvider>
  );
}

Root.propTypes = {
  component: PropTypes.elementType
};

async function main() {
  let component = HomePage;

  const plugins = await configs.loadPlugins("home-page");

  if (plugins.HomePage) {
    component = plugins.HomePage;
  }

  ReactDOM.render(<Root component={component} />, document.getElementById("home-page"));
}

main().catch(console.error);
