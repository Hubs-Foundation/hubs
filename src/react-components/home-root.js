import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import queryString from "query-string";
import { IntlProvider, injectIntl, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import homeVideo from "../assets/video/home.webm";

import HubCreatePanel from "./hub-create-panel.js";

const navigatorLang = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

const lang = navigatorLang.toLowerCase().split(/[_-]+/)[0];

import localeData from "../assets/translations.data.json";
addLocaleData([...en]);

const messages = localeData[lang] || localeData.en;

const ENVIRONMENT_URLS = [
  `${document.location.protocol}//${document.location.host}/assets/environments/cliff_meeting_space/bundle.json`
];

class HomeRoot extends Component {
  static propTypes = {
    intl: PropTypes.object
  };

  state = {
    environments: []
  };

  componentDidMount() {
    this.loadEnvironments();
    document.querySelector("#background-video").playbackRate = 0.5;
  }

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
    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className="home">
          <div className="main-content">
            <div className="header-content">
              <div className="header-content__title">
                <div className="header-content__title__name">
                  <span style={{ fontWeight: "bold" }}>moz://a</span>&nbsp;duck
                </div>
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
                        href="https://github.com/mozilla/mr-social-client"
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
                  <a className="footer-content__links__link" rel="noopener noreferrer" target="_blank" href="#">
                    <FormattedMessage id="home.join_on_slack" />
                  </a>
                  <a className="footer-content__links__link" rel="noopener noreferrer" target="_blank" href="#">
                    <FormattedMessage id="home.get_updates" />
                  </a>
                  <a className="footer-content__links__link" rel="noopener noreferrer" target="_blank" href="#">
                    <FormattedMessage id="home.report_issue" />
                  </a>
                </div>
                <div className="footer-content__links__bottom">
                  <FormattedMessage id="home.made_with_love" />
                  <span style={{ fontWeight: "bold", color: "white" }}>moz://a</span>
                </div>
              </div>
            </div>
          </div>
          <video playsInline autoPlay muted loop className="background-video" id="background-video">
            <source src={homeVideo} type="video/webm" />
          </video>
        </div>
      </IntlProvider>
    );
  }
}

export default HomeRoot;
