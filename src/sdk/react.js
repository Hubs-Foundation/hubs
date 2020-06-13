import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import * as ReactIntl from "react-intl";
import ClassNames from "classnames";
import IfFeature from "../react-components/if-feature";
import { Page } from "../react-components/layout/Page";
import { Header } from "../react-components/layout/Header";
import { Footer } from "../react-components/layout/Footer";
import PageStyles from "../react-components/layout/Page.scss";
import { AuthContext } from "../react-components/auth/AuthContext";

export default function init() {
  window.React = React;
  window.ReactDOM = ReactDOM;
  window.ReactIntl = ReactIntl;
  window.PropTypes = PropTypes;
  window.ClassNames = ClassNames;
  window.Hubs.react = {
    IfFeature,
    Page,
    Header,
    Footer,
    PageStyles,
    AuthContext
  };
}
