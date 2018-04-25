import React, { Component } from "react";
import PropTypes from "prop-types";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import homeVideo from "../assets/video/home.webm";
import classNames from "classnames";

import HubCreatePanel from "./hub-create-panel.js";
import InfoDialog from "./info-dialog.js";

const navigatorLang = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

const lang = navigatorLang.toLowerCase().split(/[_-]+/)[0];

import localeData from "../assets/translations.data.json";
addLocaleData([...en]);

const messages = localeData[lang] || localeData.en;

const ENVIRONMENT_URLS = [
  process.env.ASSET_BUNDLE_SERVER + "/rooms/meetingroom/MeetingRoom.bundle.json",
  process.env.ASSET_BUNDLE_SERVER + "/rooms/theater/Theater.bundle.json",
  process.env.ASSET_BUNDLE_SERVER + "/rooms/atrium/Atrium.bundle.json",
  process.env.ASSET_BUNDLE_SERVER + "/rooms/courtyard/Courtyard.bundle.json",
  process.env.ASSET_BUNDLE_SERVER + "/rooms/MedievalFantasyBook/MedievalFantasyBook.bundle.json"
];

class HomeRoot extends Component {
  static propTypes = {
    intl: PropTypes.object
  };

  state = {
    environments: [],
    dialogType: null,
    mailingListEmail: "",
    mailingListPrivacy: false
  };

  componentDidMount() {
    this.loadEnvironments();
    document.querySelector("#background-video").playbackRate = 0.75;
  }

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
            <div className="hero-content">
              <div className="hero-content__container">
                <div className="hero-content__container__title">
                  <FormattedMessage id="home.hero_title" />
                </div>
                <div className="hero-content__container__subtitle">
                  <FormattedMessage id="home.hero_subtitle" />
                </div>
              </div>
              <div className="hero-content__create">
                {this.state.environments.length > 0 && <HubCreatePanel environments={this.state.environments} />}
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
                    Medieval Fantasy Book by{" "}
                    <a
                      target="_blank"
                      rel="noreferrer noopener"
                      href="https://sketchfab.com/models/06d5a80a04fc4c5ab552759e9a97d91a?utm_campaign=06d5a80a04fc4c5ab552759e9a97d91a&utm_medium=embed&utm_source=oembed"
                    >
                      Pixel
                    </a>
                  </div>
                  <div>
                    <FormattedMessage id="home.made_with_love" />
                    <span style={{ fontWeight: "bold", color: "white" }}>Mozilla</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <video playsInline autoPlay muted loop className="background-video" id="background-video">
            <source src={homeVideo} type="video/webm" />
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
