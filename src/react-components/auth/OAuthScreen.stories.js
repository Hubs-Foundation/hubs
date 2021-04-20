import React from "react";
import { OAuthScreen } from "./OAuthScreen";
import backgroundUrl from "../../assets/images/home-hero-background-unbranded.png";

export default {
  title: "Auth/OAuthScreen",
  parameters: {
    layout: "fullscreen"
  }
};

export const Discord = () => (
  <OAuthScreen
    style={{ backgroundImage: `url(${backgroundUrl})` }}
    provider="discord"
    redirectUrl="#"
    termsUrl="#"
    privacyUrl="#"
  />
);

export const Slack = () => (
  <OAuthScreen
    style={{ backgroundImage: `url(${backgroundUrl})` }}
    provider="slack"
    redirectUrl="#"
    termsUrl="#"
    privacyUrl="#"
  />
);

export const NoTOS = () => (
  <OAuthScreen style={{ backgroundImage: `url(${backgroundUrl})` }} provider="discord" redirectUrl="#" privacyUrl="#" />
);

export const NoPrivacyPolicy = () => (
  <OAuthScreen style={{ backgroundImage: `url(${backgroundUrl})` }} provider="discord" redirectUrl="#" termsUrl="#" />
);

export const NoTOSOrPrivacyPolicy = () => (
  <OAuthScreen style={{ backgroundImage: `url(${backgroundUrl})` }} provider="discord" redirectUrl="#" />
);
