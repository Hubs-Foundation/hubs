import React from "react";
import { OAuthScreen } from "./OAuthScreen";
import backgroundUrl from "../../assets/images/home-hero-background-unbranded.png";

export default {
  title: "OAuthScreen",
  parameters: {
    layout: "fullscreen"
  }
};

export const Discord = () => (
  <OAuthScreen
    style={{ backgroundImage: `url(${backgroundUrl})` }}
    provider="discord"
    redirectUrl="#"
    showPrivacy
    showTerms
    termsUrl="#"
    privacyUrl="#"
  />
);

export const Slack = () => (
  <OAuthScreen
    style={{ backgroundImage: `url(${backgroundUrl})` }}
    provider="slack"
    redirectUrl="#"
    showPrivacy
    showTerms
    termsUrl="#"
    privacyUrl="#"
  />
);
