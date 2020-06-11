import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import * as ReactIntl from "react-intl";
import ClassNames from "classnames";
import configs from "../utils/configs";
import IfFeature from "../react-components/if-feature";
import { Page } from "../react-components/layout/Page";
import { Header } from "../react-components/layout/Header";
import { Footer } from "../react-components/layout/Footer";
import PageStyles from "../react-components/layout/Page.scss";
import MediaTiles from "../react-components/media-tiles";
import { CreateRoomButton } from "../react-components/input/CreateRoomButton";
import { PWAButton } from "../react-components/input/PWAButton";
import { useFeaturedRooms } from "../react-components/home/useFeaturedRooms";
import HomePageStyles from "../react-components/home/HomePage.scss";
import MediaBrowserStyles from "../assets/stylesheets/media-browser.scss";
import discordLogoSmall from "../assets/images/discord-logo-small.png";
import { AuthContext } from "../react-components/auth/AuthContext";
import { useHomePageRedirect } from "../react-components/home/useHomePageRedirect";
import { Reticulum } from "./Reticulum";

export function initSDKContext(store) {
  window.React = React;
  window.ReactDOM = ReactDOM;
  window.ReactIntl = ReactIntl;
  window.PropTypes = PropTypes;
  window.ClassNames = ClassNames;

  window.Hubs = {
    config: {
      feature: configs.feature,
      image: configs.image,
      link: configs.link
    },
    reticulum: new Reticulum(store),
    React: {
      Common: {
        PageStyles,
        Header,
        Footer,
        Page,
        IfFeature,
        AuthContext
      },
      Media: {
        Tiles: MediaTiles,
        Styles: MediaBrowserStyles
      },
      HomePage: {
        PWAButton,
        CreateRoomButton,
        useFeaturedRooms,
        useHomePageRedirect,
        Styles: HomePageStyles,
        discordLogoSmall
      }
    }
  };
}
