import React from "react";
import { LoadingScreen } from "./LoadingScreen";
import logoSrc from "../../assets/images/company-logo.png";

export default {
  title: "LoadingScreen"
};

export const Tip = () => (
  <LoadingScreen
    logoSrc={logoSrc}
    message="Loading objects 2/14"
    bottomHeader="Tip:"
    bottomMessage="Press the Q & E keys to turn left and right."
  />
);

Tip.parameters = {
  layout: "fullscreen"
};

export const WhatsNew = () => (
  <LoadingScreen
    logoSrc={logoSrc}
    message="Loading objects 2/14"
    bottomHeader="What's New?"
    bottomMessage={
      <>
        You can now set the default locale in your preferences.{" "}
        <a href="#" target="_blank">
          Read More
        </a>
      </>
    }
  />
);

WhatsNew.parameters = {
  layout: "fullscreen"
};
