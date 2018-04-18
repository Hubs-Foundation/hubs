import React, { Component } from "react";
import PropTypes from "prop-types";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import homeVideo from "../assets/video/home.webm";
import classNames from "classnames";
import formurlencoded from "form-urlencoded";

import HubCreatePanel from "./hub-create-panel.js";

const navigatorLang = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;

const lang = navigatorLang.toLowerCase().split(/[_-]+/)[0];

import localeData from "../assets/translations.data.json";
addLocaleData([...en]);

const messages = localeData[lang] || localeData.en;

const ENVIRONMENT_URLS = [
  "https://asset-bundles-prod.reticulum.io/rooms/meetingroom/MeetingRoom.bundle.json",
  "https://asset-bundles-prod.reticulum.io/rooms/theater/TheaterMeshes.bundle.json",
  "https://asset-bundles-prod.reticulum.io/rooms/atrium/AtriumMeshes.bundle.json",
  "https://asset-bundles-prod.reticulum.io/rooms/courtyard/CourtyardMeshes.bundle.json"
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
    document.querySelector("#background-video").playbackRate = 0.5;
  }

  showDialog = dialogType => {
    return e => {
      e.preventDefault();
      e.stopPropagation();
      this.setState({ dialogType });
    };
  };

  closeDialog = () => {
    this.setState({ dialogType: null });
  };

  signUpForMailingList = async e => {
    e.preventDefault();
    e.stopPropagation();
    if (!this.state.mailingListPrivacy) return;

    const url = "https://www.mozilla.org/en-US/newsletter/";

    const payload = {
      email: this.state.mailingListEmail,
      newsletters: "mixed-reality",
      privacy: true,
      fmt: "H",
      source_url: document.location.href
    };

    await fetch(url, {
      body: formurlencoded(payload),
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" }
    }).then(() => this.setState({ dialogType: "email_submitted" }));
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
    let dialogTitle = null;
    let dialogBody = null;

    switch (this.state.dialogType) {
      // TODO i18n, FormattedMessage doesn't play nicely with links
      case "slack":
        dialogTitle = "Get in Touch";
        dialogBody = (
          <span>
            Want to join the conversation?
            <p />
            Join us on the{" "}
            <a href="https://webvr-slack.herokuapp.com/" target="_blank" rel="noopener noreferrer">
              WebVR Slack
            </a>{" "}
            in the #social channel.<br />VR meetups every Friday at noon PST!
            <p /> Or, tweet at{" "}
            <a href="https://twitter.com/mozillareality" target="_blank" rel="noopener noreferrer">
              @mozillareality
            </a>{" "}
            on Twitter.
          </span>
        );
        break;
      case "email_submitted":
        dialogTitle = "";
        dialogBody = "Great! Please check your e-mail to confirm your subscription.";
        break;
      case "updates":
        dialogTitle = "";
        dialogBody = (
          <span>
            Sign up to get release notes about new features.
            <p />
            <form onSubmit={this.signUpForMailingList}>
              <div className="mailing-list-form">
                <input
                  type="email"
                  value={this.state.mailingListEmail}
                  onChange={e => this.setState({ mailingListEmail: e.target.value })}
                  className="mailing-list-form__email_field"
                  required
                  placeholder="Your email here"
                />
                <label className="mailing-list-form__privacy">
                  <input
                    className="mailing-list-form__privacy_checkbox"
                    type="checkbox"
                    required
                    value={this.state.mailingListPrivacy}
                    onChange={e => this.setState({ mailingListPrivacy: e.target.checked })}
                  />
                  <span className="mailing-list-form__privacy_label">
                    <FormattedMessage id="mailing_list.privacy_label" />{" "}
                    <a target="_blank" rel="noopener noreferrer" href="https://www.mozilla.org/en-US/privacy/">
                      <FormattedMessage id="mailing_list.privacy_link" />
                    </a>
                  </span>
                </label>
                <input className="mailing-list-form__submit" type="submit" value="Sign Up Now" />
              </div>
            </form>
          </span>
        );
        break;
      case "report":
        dialogTitle = "Report an Issue";
        dialogBody = (
          <span>
            Need to report a problem?
            <p />
            You can file a{" "}
            <a href="https://github.com/mozilla/mr-social-client/issues" target="_blank" rel="noopener noreferrer">
              Github Issue
            </a>{" "}
            or e-mail us for support at <a href="mailto:hubs@mozilla.com">hubs@mozilla.com</a>.
            <p />
            You can also find us in #social on the{" "}
            <a href="http://webvr-slack.herokuapp.com/" target="_blank" rel="noopener noreferrer">
              WebVR Slack
            </a>.
          </span>
        );
        break;
    }

    const mainContentClassNames = classNames({ "main-content": true, "main-content--noninteractive": !!dialogTitle });

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
                  <a
                    className="footer-content__links__link"
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.showDialog("slack")}
                  >
                    <FormattedMessage id="home.join_us" />
                  </a>
                  <a
                    className="footer-content__links__link"
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.showDialog("updates")}
                  >
                    <FormattedMessage id="home.get_updates" />
                  </a>
                  <a
                    className="footer-content__links__link"
                    rel="noopener noreferrer"
                    href="#"
                    onClick={this.showDialog("report")}
                  >
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
          {this.state.dialogType && (
            <div className="overlay">
              <div className="dialog">
                <div className="dialog__box">
                  <div className="dialog__box__contents">
                    <button className="dialog__box__contents__close" onClick={this.closeDialog}>
                      <span>🗙</span>
                    </button>
                    <div className="dialog__box__contents__title">{dialogTitle}</div>
                    <div className="dialog__box__contents__body">{dialogBody}</div>
                    <div className="dialog__box__contents__button-container" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </IntlProvider>
    );
  }
}

export default HomeRoot;
