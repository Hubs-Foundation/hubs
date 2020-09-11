import React from "react";
import { LoadingScreen } from "./LoadingScreen";
import logoSrc from "../../assets/images/company-logo.png";

export default {
  title: "LoadingScreen"
};

export const Base = () => (
  <LoadingScreen logoSrc={logoSrc} message="Loading objects 2/14" tip="Press the Q & E keys to turn left and right." />
);

Base.parameters = {
  layout: "fullscreen"
};
