import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import queryString from "query-string";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";

const navigatorLang = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

const lang = navigatorLang.toLowerCase().split(/[_-]+/)[0];

import localeData from "../assets/translations.data.json";
addLocaleData([...en]);

const messages = localeData[lang] || localeData.en;

class HomeRoot extends Component {
  static propTypes = {};

  state = {};

  componentDidMount() {}

  render() {
    return <div>Hello</div>;
  }
}

export default HomeRoot;
