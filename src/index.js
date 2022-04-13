import React from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "./telemetry";
import Store from "./storage/store";
import "./utils/theme";
import { AuthContextProvider } from "./react-components/auth/AuthContext";
import "./react-components/styles/global.scss";
import { HomePage } from "./react-components/page/HomePage";
import { SigninPage } from "./react-components/page/SigninPage";
import { SignupPage } from "./react-components/page/SignupPage";
import { ManagerPage } from "./react-components/page/ManagerPage";
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
        <HomePage />
      );
    
    case 'signin':
      return (
        <SigninPage/>
      );

    case 'signup':
      return (
        <SignupPage/>
      );
    
    case 'manager':
      return (
        <ManagerPage/>
      );

    default:
      return (
        <HomePage />
      );
     
  }
}

ReactDOM.render(<Root />, document.getElementById("home-root"));
