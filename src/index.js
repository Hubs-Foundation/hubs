import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { IntlProvider } from "react-intl";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { HomePage } from "./react-components/home/HomePage";
import { lang, messages } from "./utils/i18n";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { SignInPage } from "./react-components/auth/SignInPage";
import { VerifyPage } from "./react-components/auth/VerifyPage";

registerTelemetry("/home", "Hubs Home Page");

const store = new Store();
window.APP = { store };

function Routes() {
  return (
    <BrowserRouter>
      <IntlProvider locale={lang} messages={messages}>
        <AuthContextProvider store={store}>
          <Switch>
            <Route exact path="/" component={HomePage} />
            <Route path="/signin" component={SignInPage} />
            <Route path="/verify" component={VerifyPage} />
          </Switch>
        </AuthContextProvider>
      </IntlProvider>
    </BrowserRouter>
  );
}

ReactDOM.render(<Routes />, document.getElementById("ui-root"));
