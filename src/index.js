import React from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { IntlProvider, addLocaleData } from "react-intl";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { HomePage } from "./react-components/home/HomePage";
import { lang, messages } from "./utils/i18n";
import { SDKContext } from "./react-components/sdk/SDKContext";
import configs from "./utils/configs";
import en from "react-intl/locale-data/en";
import { SDK } from "./sdk/SDK";
import initCore from "./sdk/core";
import initReact from "./sdk/react";
import initHomePage from "./sdk/home-page";
import initMediaBrowser from "./sdk/media-browser";

addLocaleData([...en]);
registerTelemetry("/home", "Hubs Home Page");

const store = new Store();
window.APP = { store };
const sdk = new SDK(store);

function Root({ component: HomePageComponent }) {
  return (
    <IntlProvider locale={lang} messages={messages}>
      <SDKContext.Provider value={sdk}>
        <HomePageComponent />
      </SDKContext.Provider>
    </IntlProvider>
  );
}

Root.propTypes = {
  component: PropTypes.elementType
};

async function main() {
  let component = HomePage;

  // TODO: in the future load these dynamically using the plugins dependencies array
  window.Hubs = {};
  initCore(store);
  initReact();
  initHomePage();
  initMediaBrowser();

  const plugins = await configs.loadPlugins("home-page");

  if (plugins.HomePage) {
    component = plugins.HomePage;
  }

  ReactDOM.render(<Root component={component} />, document.getElementById("ui-root"));
}

main().catch(console.error);
