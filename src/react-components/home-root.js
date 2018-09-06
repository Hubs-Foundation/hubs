import React, { Component } from "react";
import PropTypes from "prop-types";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";

import { lang, messages } from "../utils/i18n";
import homeVideoWebM from "../assets/video/home.webm";
import homeVideoMp4 from "../assets/video/home.mp4";
import classNames from "classnames";
import { ENVIRONMENT_URLS } from "../assets/environments/environments";

import styles from "../assets/stylesheets/index.scss";

import HubCreatePanel from "./hub-create-panel.js";
import InfoDialog from "./info-dialog.js";

addLocaleData([...en]);

class HomeRoot extends Component {
  static propTypes = {
    intl: PropTypes.object,
    dialogType: PropTypes.symbol,
    initialEnvironment: PropTypes.string
  };

  state = {
    environments: [],
    dialogType: null,
    mailingListEmail: "",
    mailingListPrivacy: false
  };

  componentDidMount() {
    this.loadEnvironments();
    this.setState({ dialogType: this.props.dialogType });
    this.loadHomeVideo();
  }

  loadHomeVideo = () => {
    const videoEl = document.querySelector("#background-video");
    videoEl.playbackRate = 0.9;
    function toggleVideo() {
      // Play the video if the window/tab is visible.
      if (document.hasFocus()) {
        videoEl.play();
      } else {
        videoEl.pause();
      }
    }
    if ("hasFocus" in document) {
      document.addEventListener("visibilitychange", toggleVideo);
      window.addEventListener("focus", toggleVideo);
      window.addEventListener("blur", toggleVideo);
    }
  };

  showDialog = dialogType => {
    return e => {
      e.preventDefault();
      e.stopPropagation();
      this.setState({ dialogType });
    };
  };

  loadEnvironments = () => {
    const environments = [];

    const environmentLoads = ENVIRONMENT_URLS.map(src =>
      (async () => {
        const res = await fetch(src);
        const data = await res.json();
        data.bundle_url = src;
        environments.push(data);
      })()
    );

    Promise.all(environmentLoads).then(() => this.setState({ environments }));
  };

  render() {
    const mainContentClassNames = classNames({
      [styles.mainContent]: true,
      [styles.noninteractive]: !!this.state.dialogType
    });
    const dialogTypes = InfoDialog.dialogTypes;

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={styles.home}>
          <div className={mainContentClassNames}>
            <div className={styles.headerContent}>
              <div className={styles.titleAndNav} onClick={() => (document.location = "/")}>
                <div className={styles.hubs}>hubs</div>
                <div className={styles.preview}>preview</div>
                <div className={styles.links}>
                  <a href="https://github.com/mozilla/hubs" rel="noreferrer noopener">
                    <FormattedMessage id="home.source_link" />
                  </a>
                  <a
                    href="https://blog.mozvr.com/introducing-hubs-a-new-way-to-get-together-online/"
                    rel="noreferrer noopener"
                  >
                    <FormattedMessage id="home.about_link" />
                  </a>
                </div>
              </div>
              <div className={styles.ident} />
            </div>
            <div className={styles.heroContent}>
              <div className={styles.attribution}>
                Medieval Fantasy Book by{" "}
                <a
                  target="_blank"
                  rel="noreferrer noopener"
                  href="https://sketchfab.com/models/06d5a80a04fc4c5ab552759e9a97d91a?utm_campaign=06d5a80a04fc4c5ab552759e9a97d91a&utm_medium=embed&utm_source=oembed"
                >
                  Pixel
                </a>
              </div>
              <div className={styles.container}>
                <div className={styles.title}>
                  <FormattedMessage id="home.hero_title" />
                </div>
                <div className={styles.subtitle}>
                  <FormattedMessage id="home.hero_subtitle" />
                </div>
              </div>
              <div className={styles.create}>
                {this.state.environments.length > 0 && (
                  <HubCreatePanel
                    initialEnvironment={this.props.initialEnvironment}
                    environments={this.state.environments}
                  />
                )}
              </div>
            </div>
            <div className={styles.footerContent}>
              <div className={styles.links}>
                <div className={styles.top}>
                  <a
                    className={styles.link}
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.showDialog(dialogTypes.slack)}
                  >
                    <FormattedMessage id="home.join_us" />
                  </a>
                  <a
                    className={styles.link}
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.showDialog(dialogTypes.updates)}
                  >
                    <FormattedMessage id="home.get_updates" />
                  </a>
                  <a
                    className={styles.link}
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.showDialog(dialogTypes.report)}
                  >
                    <FormattedMessage id="home.report_issue" />
                  </a>
                  <a
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/mozilla/hubs/blob/master/TERMS.md"
                  >
                    <FormattedMessage id="home.terms_of_use" />
                  </a>
                  <a
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md"
                  >
                    <FormattedMessage id="home.privacy_notice" />
                  </a>
                </div>
                <div className={styles.bottom}>
                  <div>
                    <FormattedMessage id="home.made_with_love" />
                    <span style={{ fontWeight: "bold", color: "white" }}>Mozilla</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <video playsInline muted loop autoPlay className={styles.backgroundVideo} id="background-video">
            <source src={homeVideoWebM} type="video/webm" />
            <source src={homeVideoMp4} type="video/mp4" />
          </video>
          {this.state.dialogType && (
            <InfoDialog
              dialogType={this.state.dialogType}
              onClose={() => this.setState({ dialogType: null })}
              onSubmittedEmail={() => this.setState({ dialogType: dialogTypes.email_submitted })}
            />
          )}
        </div>
      </IntlProvider>
    );
  }
}

export default HomeRoot;
