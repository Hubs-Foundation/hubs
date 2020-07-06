import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import * as ReactIntl from "react-intl";
import ClassNames from "classnames";

import _IfFeature from "../react-components/if-feature";
import { Page as _Page } from "../react-components/layout/Page";
import { Header as _Header } from "../react-components/layout/Header";
import { Footer as _Footer } from "../react-components/layout/Footer";
import { useStore as _useStore } from "../react-components/store/useStore";
import { useFavoriteRooms as _useFavoriteRooms } from "../react-components/sdk/useFavoriteRooms";
import { usePublicRooms as _usePublicRooms } from "../react-components/sdk/usePublicRooms";
import { useInstallPWA as _useInstallPWA } from "../react-components/sdk/useInstallPWA";
import { useCreateAndRedirectToRoom as _useCreateAndRedirectToRoom } from "../react-components/sdk/useCreateAndRedirectToRoom";

const react = {
  IfFeature: _IfFeature,
  Page: _Page,
  Header: _Header,
  Footer: _Footer,
  useStore: _useStore,
  useFavoriteRooms: _useFavoriteRooms,
  usePublicRooms: _usePublicRooms,
  useInstallPWA: _useInstallPWA,
  useCreateAndRedirectToRoom: _useCreateAndRedirectToRoom
};

if (window.Hubs) {
  window.Hubs.react = react;
} else {
  window.Hubs = { react };
}

window.React = React;
window.ReactDOM = ReactDOM;
window.ReactIntl = ReactIntl;
window.PropTypes = PropTypes;
window.ClassNames = ClassNames;

export const IfFeature = _IfFeature;
export const Page = _Page;
export const Header = _Header;
export const Footer = _Footer;
export const useStore = _useStore;
export const useFavoriteRooms = _useFavoriteRooms;
export const usePublicRooms = _usePublicRooms;
export const useInstallPWA = _useInstallPWA;
export const useCreateAndRedirectToRoom = _useCreateAndRedirectToRoom;
