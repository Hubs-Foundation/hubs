import React from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { IntlProvider } from "react-intl";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { HomePage } from "./react-components/home/HomePage";
import { lang, messages } from "./utils/i18n";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import configs from "./utils/configs";

registerTelemetry("/home", "Hubs Home Page");

const store = new Store();
window.APP = { store };

function Root({ component: HomePageComponent }) {
  return (
    <IntlProvider locale={lang} messages={messages}>
      <AuthContextProvider store={store}>
        <HomePageComponent />
      </AuthContextProvider>
    </IntlProvider>
  );
}

Root.propTypes = {
  component: PropTypes.elementType
};

async function main() {
  let component = HomePage;

  if (configs.hasPlugin("home-page")) {
    window.React = React;
    const plugin = await configs.importPlugin("home-page");
    component = plugin.HomePage;
  }

  ReactDOM.render(<Root component={component} />, document.getElementById("ui-root"));
}

main().catch(console.error);
