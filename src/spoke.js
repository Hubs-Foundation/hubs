import ReactDOM from "react-dom";
import React, { Component } from "react";
//import PropTypes from "prop-types";
//import classNames from "classnames";
import { IntlProvider, /*FormattedMessage, */ addLocaleData } from "react-intl";
import styles from "./assets/stylesheets/spoke.scss";

//const qs = new URLSearchParams(location.search);

import registerTelemetry from "./telemetry";

registerTelemetry();

import en from "react-intl/locale-data/en";
import { lang, messages } from "./utils/i18n";

addLocaleData([...en]);

class SpokeLanding extends Component {
  static propTypes = {};

  state = {};

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={styles.ui}>HI</div>
      </IntlProvider>
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<SpokeLanding />, document.getElementById("ui-root"));
});
