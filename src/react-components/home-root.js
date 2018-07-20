import React, { Component } from "react";
import PropTypes from "prop-types";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";

import { lang, messages } from "../utils/i18n";
import homeVideoWebM from "../assets/video/home.webm";
import homeVideoMp4 from "../assets/video/home.mp4";
import classNames from "classnames";
import { ENVIRONMENT_URLS } from "../assets/environments/environments";

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
    videoEl.playbackRate = 0.75;
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
      "main-content": true,
      "main-content--noninteractive": !!this.state.dialogType
    });
    const dialogTypes = InfoDialog.dialogTypes;

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className="home">
          <div className={mainContentClassNames}>
            <div className="header-content">
              <div className="header-content__title">
                <img className="header-content__title__name" src="../assets/images/logo.svg" />
                <div className="header-content__title__preview">preview</div>
              </div>
              <div className="header-content__entry-code">
                <a className="header-content__entry-code__link" href="/link" rel="nofollow">
                  <FormattedMessage id="home.have_entry_code" />
                </a>
              </div>
              <div className="header-content__experiment">
                <div className="header-content__experiment__container">
                  <img src="../assets/images/webvr_cube.svg" className="header-content__experiment__icon" />
                  <div className="header-content__experiment__info">
                    <div className="header-content__experiment__info__header">
                      <span>
                        <FormattedMessage id="home.webvr_disclaimer_pre" />
                      </span>
                      <span style={{ fontWeight: "bold" }}>WebVR</span>
                      <span>
                        <FormattedMessage id="home.webvr_disclaimer_post" />
                      </span>
                      <span>
                        <a rel="noopener noreferrer" target="_blank" href="https://blog.mozvr.com">
                          <FormattedMessage id="home.webvr_disclaimer_mr_team" />
                        </a>
                      </span>
                    </div>

                    <div>
                      <a
                        className="header-content__experiment__info__link"
                        rel="noopener noreferrer"
                        target="_blank"
                        href="https://github.com/mozilla/hubs"
                      >
                        <FormattedMessage id="home.view_source" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="header-subtitle">
              <div>
                <a className="header-subtitle__link" href="/link" rel="nofollow">
                  <FormattedMessage id="home.have_entry_code" />
                </a>
              </div>
            </div>
            <div className="hero-content">
              <div className="hero-content__attribution">
                Medieval Fantasy Book by{" "}
                <a
                  target="_blank"
                  rel="noreferrer noopener"
                  href="https://sketchfab.com/models/06d5a80a04fc4c5ab552759e9a97d91a?utm_campaign=06d5a80a04fc4c5ab552759e9a97d91a&utm_medium=embed&utm_source=oembed"
                >
                  Pixel
                </a>
              </div>
              <div className="hero-content__container">
                <div className="hero-content__container__title">
                  <FormattedMessage id="home.hero_title" />
                </div>
                <div className="hero-content__container__subtitle">
                  <FormattedMessage id="home.hero_subtitle" />
                </div>
              </div>
              <div className="hero-content__create">
                {this.state.environments.length > 0 && (
                  <HubCreatePanel
                    initialEnvironment={this.props.initialEnvironment}
                    environments={this.state.environments}
                  />
                )}
              </div>
            </div>
            <div className="footer-content">
              <div className="footer-content__links">
                <div className="footer-content__links__top">
                  <a
                    className="footer-content__links__link"
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.showDialog(dialogTypes.slack)}
                  >
                    <FormattedMessage id="home.join_us" />
                  </a>
                  <a
                    className="footer-content__links__link"
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.showDialog(dialogTypes.updates)}
                  >
                    <FormattedMessage id="home.get_updates" />
                  </a>
                  <a
                    className="footer-content__links__link"
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.showDialog(dialogTypes.report)}
                  >
                    <FormattedMessage id="home.report_issue" />
                  </a>
                  <a
                    className="footer-content__links__link"
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/mozilla/hubs/blob/master/TERMS.md"
                  >
                    <FormattedMessage id="home.terms_of_use" />
                  </a>
                  <a
                    className="footer-content__links__link"
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://github.com/mozilla/hubs/blob/master/PRIVACY.md"
                  >
                    <FormattedMessage id="home.privacy_notice" />
                  </a>
                </div>
                <div className="footer-content__links__bottom">
                  <div>
                    <FormattedMessage id="home.made_with_love" />
                    <span style={{ fontWeight: "bold", color: "white" }}>Mozilla</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <video playsInline muted loop autoPlay className="background-video" id="background-video">
            <source src={homeVideoWebM} type="video/webm" />
            <source src={homeVideoMp4} type="video/mp4" />
          </video>
          {this.state.dialogType && (
            <InfoDialog
              dialogType={this.state.dialogType}
              onCloseDialog={() => this.setState({ dialogType: null })}
              onSubmittedEmail={() => this.setState({ dialogType: dialogTypes.email_submitted })}
            />
          )}
        </div>
      </IntlProvider>
    );
  }
}

export default HomeRoot;
