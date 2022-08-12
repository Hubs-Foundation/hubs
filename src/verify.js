import React from "react";
import ReactDOM from "react-dom";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import { VerifyModalContainer } from "./react-components/auth/VerifyModalContainer";
import "./react-components/styles/global.scss";
import "./assets/stylesheets/globals.scss";
import { Center } from "./react-components/layout/Center";
import "./assets/larchiveum/manager.scss"
import logo from "./assets/images/larchiveum_logo.png";

registerTelemetry("/verify", "Hubs Verify Email Page");

const store = new Store();
window.APP = { store };

function Root() {
  return (
    <div className='manager-page  height-100vh'>
      <div className="row_1">
        <a href="/" style={{float: 'left', height: '100%'}}>
          <img src={logo} style={{height: '100%'}}/>
        </a>
      </div>
      <div className="row_2 paddingtop25vh">
        <WrappedIntlProvider>
          <AuthContextProvider store={store}>
              <Center>
                <VerifyModalContainer />
              </Center>
            </AuthContextProvider>
        </WrappedIntlProvider>
      </div>
    </div>
  );
}

ReactDOM.render(<Root />, document.getElementById("ui-root"));
