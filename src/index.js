/* eslint-disable no-unused-vars */
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
import { ContentPage } from "./react-components/page/ContentPage";
import { ViewQuizPage } from "./react-components/page/ViewQuizPage";
import { ManagerPage } from "./react-components/page/ManagerPage";
import { ForgotPasswordPage } from "./react-components/page/ForgotPasswordPage";
import { ResetPasswordPage } from "./react-components/page/ResetPasswordPage";
import { WarningVerifyPage } from "./react-components/page/WarningVerifyPage";
import { ProfilePage } from "./react-components/page/ProfilePage";
import { CallbackNaverOAuthPage } from "./react-components/page/CallbackNaverOAuthPage";

registerTelemetry("/home", "Hubs Home Page");

const store = new Store();
window.APP = { store };

const getPage = () => {
  return new URL(location.href).searchParams.get("page");
};

function Root() {
  const page = getPage();
  switch (page) {
    case "home":
      return <HomePage />;

    case "signin":
      return <SigninPage />;

    case "signup":
      return <SignupPage />;
    case "warning-verify":
      return <WarningVerifyPage />;

    case "content":
      return <ContentPage />;

    case "manager":
      return <ManagerPage />;

    case "forgot-password":
      return <ForgotPasswordPage />;

    case "reset-password":
      return <ResetPasswordPage />;

    case "profile":
      return <ProfilePage props={{ avarar: "Avt", name: "Name" }} />;

    case "callback-naver-oauth":
      return <CallbackNaverOAuthPage />;

    case "view-quiz":
      return <ViewQuizPage />;

    default:
      return <HomePage />;
  }
}

ReactDOM.render(<Root />, document.getElementById("home-root"));
