import React from "react";
import ReactDOM from "react-dom";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { HomePage } from "./react-components/home/HomePage";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import "./react-components/styles/global.scss";
import { ThemeProvider } from "./react-components/styles/theme";
import { SigninPage } from "./react-components/page/SigninPage";

registerTelemetry("/home", "Hubs Home Page");

const store = new Store();
window.APP = { store };

const getPage = ()=>{
  return (new URL(location.href)).searchParams.get('page');
}

function Root() {
  const page = getPage();
  switch (page) {
    case 'home':
      return (
        <WrappedIntlProvider>
          <ThemeProvider store={store}>
            <AuthContextProvider store={store}>
              <HomePage />
            </AuthContextProvider>
          </ThemeProvider>
        </WrappedIntlProvider>
      );
    
    case 'signin':
      return (
        <SigninPage></SigninPage>
      );
  
    default:
      return (
        <WrappedIntlProvider>
          <ThemeProvider store={store}>
            <AuthContextProvider store={store}>
              <HomePage />
            </AuthContextProvider>
          </ThemeProvider>
        </WrappedIntlProvider>
      );
     
  }
}

ReactDOM.render(<Root />, document.getElementById("home-root"));
