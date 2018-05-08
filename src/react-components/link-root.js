import React, { Component } from "react";
import PropTypes from "prop-types";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";

import { lang, messages } from "../utils/i18n";
import classNames from "classnames";
import styles from "../assets/stylesheets/link.scss";

addLocaleData([...en]);

class LinkRoot extends Component {
  static propTypes = {
    intl: PropTypes.object
  };

  state = {};

  componentDidMount() {}

  render() {
    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className="link">Hello</div>
      </IntlProvider>
    );
  }
}

export default LinkRoot;
