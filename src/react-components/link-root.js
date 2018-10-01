import React, { Component } from "react";
import PropTypes from "prop-types";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";

import { lang, messages } from "../utils/i18n";
import classNames from "classnames";
import styles from "../assets/stylesheets/link.scss";
import { disableiOSZoom } from "../utils/disable-ios-zoom";
import LinkDialogHeader from "../assets/images/link_dialog_header.svg";

const MAX_DIGITS = 6;
const MAX_LETTERS = 4;

addLocaleData([...en]);
disableiOSZoom();

class LinkRoot extends Component {
  static propTypes = {
    intl: PropTypes.object,
    store: PropTypes.object,
    linkChannel: PropTypes.object
  };

  state = {
    entered: "",
    isAlphaMode: false,
    failedAtLeastOnce: false
  };

  componentDidMount = () => {
    document.addEventListener("keydown", this.handleKeyDown);
  };

  componentWillUnmount = () => {
    document.removeEventListener("keydown", this.handleKeyDown);
  };

  handleKeyDown = e => {
    // Number keys 0-9
    if ((e.keyCode < 48 || e.keyCode > 57) && !this.state.isAlphaMode) {
      return;
    }

    // Alpha keys A-I
    if ((e.keyCode < 65 || e.keyCode > 73) && this.state.isAlphaMode) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (this.state.isAlphaMode) {
      this.addToEntry("IHGFEDCBA"[73 - e.keyCode]);
    } else {
      this.addToEntry(e.keyCode - 48);
    }
  };

  maxAllowedChars = () => {
    return this.state.isAlphaMode ? MAX_LETTERS : MAX_DIGITS;
  };

  addToEntry = ch => {
    if (this.state.entered.length >= this.maxAllowedChars()) return;
    const newChars = `${this.state.entered}${ch}`;

    if (newChars.length === this.maxAllowedChars()) {
      this.attemptLookup(newChars);
    }

    this.setState({ entered: newChars });
  };

  removeChar = () => {
    const entered = this.state.entered;
    if (entered.length === 0) return;
    this.setState({ entered: entered.substring(0, entered.length - 1) });
  };

  attemptLink = async code => {
    this.props.linkChannel
      .attemptLink(code)
      .then(response => {
        // If there is a profile from the linked device, copy it over if we don't have one yet.
        if (response.profile) {
          const { hasChangedName } = this.props.store.state.activity;

          if (!hasChangedName) {
            this.props.store.update({ activity: { hasChangedName: true }, profile: response.profile });
          }
        }

        if (response.path) {
          window.location.href = response.path;
        }
      })
      .catch(e => {
        this.setState({ failedAtLeastOnce: true, enteredDigits: "" });

        if (!(e instanceof Error && (e.message === "in_use" || e.message === "failed"))) {
          throw e;
        }
      });
  };

  attemptEntry = async code => {
    const url = "https://hub.link/" + code;
    const res = await fetch(url);

    if (res.status >= 400) {
      this.setState({ failedAtLeastOnce: true, entered: "" });
    } else {
      document.location = url;
    }
  };

  attemptLookup = async code => {
    if (this.state.isAlphaMode) {
      // Headset link code
      this.attemptLink(code);
    } else {
      // Room entry code
      this.attemptEntry(code);
    }
  };

  toggleMode = () => {
    this.setState({ isAlphaMode: !this.state.isAlphaMode, entered: "" });
  };

  render() {
    // Note we use type "tel" for the input due to https://bugzilla.mozilla.org/show_bug.cgi?id=1005603

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={styles.link}>
          <div className={styles.linkContents}>
            {this.state.entered.length === this.maxAllowedChars() && (
              <div className={classNames("loading-panel", styles.codeLoadingPanel)}>
                <div className="loader-wrap">
                  <div className="loader">
                    <div className="loader-center" />
                  </div>
                </div>
              </div>
            )}

            <div className={styles.enteredContents}>
              <div className={styles.header}>
                <FormattedMessage
                  id={
                    this.state.failedAtLeastOnce
                      ? "link.try_again"
                      : "link.link_page_header_" + (!this.state.isAlphaMode ? "entry" : "headset")
                  }
                />
              </div>

              <div className={styles.entered}>
                <input
                  className={styles.charInput}
                  type={this.state.isAlphaMode ? "text" : "tel"}
                  pattern="[0-9A-I]*"
                  value={this.state.entered}
                  onChange={ev => {
                    this.setState({ entered: ev.target.value });
                  }}
                  placeholder={this.state.isAlphaMode ? "- - - -" : "- - - - - -"}
                />
              </div>

              <div className={styles.enteredFooter}>
                {!this.state.isAlphaMode && (
                  <img onClick={() => this.toggleMode()} src={LinkDialogHeader} className={styles.headsetIcon} />
                )}
                {!this.state.isAlphaMode && (
                  <span>
                    <a href="#" onClick={() => this.toggleMode()}>
                      <FormattedMessage id="link.linking_a_headset" />
                    </a>
                  </span>
                )}
                <img className={styles.entryFooterImage} src="../assets/images/logo.svg" />
              </div>
            </div>

            <div className={styles.keypad}>
              {(this.state.isAlphaMode
                ? ["A", "B", "C", "D", "E", "F", "G", "H", "I"]
                : [1, 2, 3, 4, 5, 6, 7, 8, 9]
              ).map((d, i) => (
                <button
                  disabled={this.state.entered.length === this.maxAllowedChars()}
                  key={`char_${i}`}
                  className={styles.keypadButton}
                  onClick={() => this.addToEntry(d)}
                >
                  {d}
                </button>
              ))}
              <button
                className={classNames(styles.keypadButton, styles.keypadToggleMode)}
                onClick={() => this.toggleMode()}
              >
                {this.state.isAlphaMode ? "123" : "ABC"}
              </button>
              {!this.state.isAlphaMode && (
                <button
                  disabled={this.state.entered.length === this.maxAllowedChars()}
                  className={classNames(styles.keypadButton, styles.keypadZeroButton)}
                  onClick={() => this.addToEntry(0)}
                >
                  0
                </button>
              )}
              <button
                disabled={this.state.entered.length === 0 || this.state.entered.length === this.maxAllowedChars()}
                className={classNames(styles.keypadButton, styles.keypadBackspace)}
                onClick={() => this.removeChar()}
              >
                ⌫
              </button>
            </div>

            <div className={styles.footer}>
              {!this.state.isAlphaMode && (
                <div className={styles.linkHeadsetFooterLink}>
                  <img onClick={() => this.toggleMode()} src={LinkDialogHeader} className={styles.headsetIcon} />
                  <span>
                    <a href="#" onClick={() => this.toggleMode()}>
                      <FormattedMessage id="link.linking_a_headset" />
                    </a>
                  </span>
                </div>
              )}
              <img className={styles.footerImage} src="../assets/images/logo.svg" alt="Logo" />
            </div>
          </div>
        </div>
      </IntlProvider>
    );
  }
}

export default LinkRoot;
