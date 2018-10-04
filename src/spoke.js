import ReactDOM from "react-dom";
import React, { Component } from "react";
//import PropTypes from "prop-types";
//import classNames from "classnames";
import { playVideoWithStopOnBlur } from "./utils/video-utils.js";
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

  componentDidMount() {
    this.loadVideo();
  }

  loadVideo() {
    const videoEl = document.querySelector("#preview-video");
    playVideoWithStopOnBlur(videoEl);
  }

  render() {
    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={styles.ui}>
          <div className={styles.header}>
            <div className={styles.headerLinks}>
              <a href="/about" rel="noopener noreferrer">
                About
              </a>
              <a href="https://github.com/mozillareality/spoke" rel="noopener noreferrer">
                Source
              </a>
              <a href="https://github.com/mozilla/hubs" rel="noopener noreferrer">
                Hubs
              </a>
            </div>
          </div>
          <div className={styles.content}>
            <div className={styles.heroPane}>
              <div className={styles.heroMessage}>Message</div>
              <div className={styles.heroVideo}>
                <video playsInline muted loop autoPlay className={styles.previewVideo} id="preview-video">
                  <source
                    src="https://assets-prod.reticulum.io/assets/video/home-aee18c619a9005bd4b0d31295670af80.webm"
                    type="video/webm"
                  />
                  <source
                    src="https://assets-prod.reticulum.io/assets/video/home-5af051d2c531928dbaaf51b9badaabde.mp4"
                    type="video/mp4"
                  />
                </video>
              </div>
            </div>
          </div>
          <div className={styles.bg} />
        </div>
      </IntlProvider>
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<SpokeLanding />, document.getElementById("ui-root"));
});
