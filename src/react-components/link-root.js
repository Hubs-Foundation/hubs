import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { WrappedIntlProvider } from "./wrapped-intl-provider";
import configs from "../utils/configs";
import classNames from "classnames";
import styles from "../assets/stylesheets/link.scss";
import { disableiOSZoom } from "../utils/disable-ios-zoom";
import HeadsetIcon from "../assets/images/generic_vr_headset.svg";

const MAX_DIGITS = 6;
const MAX_LETTERS = 4;

disableiOSZoom();
const hasTouchEvents = "ontouchstart" in document.documentElement;

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

  buttonRefs = {};

  componentDidMount = () => {
    document.addEventListener("keydown", this.handleKeyDown);
    this.attachTouchEvents();
  };

  attachTouchEvents = () => {
    // https://github.com/facebook/react/issues/9809#issuecomment-413978405
    if (hasTouchEvents) {
      for (const [name, ref] of Object.entries(this.buttonRefs)) {
        if (!ref) continue;
        if (name === "remove") {
          ref.ontouchstart = () => this.removeChar();
        } else if (name === "toggle") {
          ref.ontouchstart = () => this.toggleMode();
        } else {
          ref.ontouchstart = () => this.addToEntry(name);
        }
      }
    }
  };

  componentDidUpdate = () => {
    this.attachTouchEvents();
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

    this.setState({ entered: newChars }, () => {
      if (this.state.entered.length === this.maxAllowedChars()) {
        this.attemptLookup(this.state.entered);
      }
    });
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
        this.props.store.update({ credentials: response.credentials });

        if (response.path) {
          window.location.href = response.path;
        }
      })
      .catch(e => {
        this.setState({ failedAtLeastOnce: true, entered: "" });

        if (!(e instanceof Error && (e.message === "in_use" || e.message === "failed"))) {
          throw e;
        }
      });
  };

  attemptEntry = async code => {
    const url = "/link/" + code;
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
    this.setState({ isAlphaMode: !this.state.isAlphaMode, entered: "", failedAtLeastOnce: false });
  };

  render() {
    // Note we use type "tel" for the input due to https://bugzilla.mozilla.org/show_bug.cgi?id=1005603

    return (
      <WrappedIntlProvider>
        <div className={styles.link}>
          <div className={styles.linkContents}>
            <a className={styles.logo} href="/">
              <img src={configs.image("logo")} />
            </a>
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
                    if (!this.state.isAlphaMode && ev.target.value.match(/[a-z]/i)) {
                      this.setState({ isAlphaMode: true });
                    }

                    this.setState({ entered: ev.target.value.toUpperCase() }, () => {
                      if (this.state.entered.length === this.maxAllowedChars()) {
                        this.attemptLookup(this.state.entered);
                      }
                    });
                  }}
                />
              </div>

              <div className={styles.enteredFooter}>
                {!this.state.isAlphaMode && (
                  <span>
                    <a href="#" onClick={() => this.toggleMode()}>
                      <FormattedMessage id="link.linking_a_headset" />
                    </a>
                  </span>
                )}
              </div>
            </div>

            <div className={styles.keypad}>
              {(this.state.isAlphaMode
                ? ["A", "B", "C", "D", "E", "F", "G", "H", "I"]
                : [1, 2, 3, 4, 5, 6, 7, 8, 9]
              ).map((d, i) => (
                <button
                  disabled={this.state.entered.length === this.maxAllowedChars()}
                  className={styles.keypadButton}
                  key={`char_${i}`}
                  onClick={() => {
                    if (!hasTouchEvents) this.addToEntry(d);
                  }}
                  ref={r => (this.buttonRefs[d.toString()] = r)}
                >
                  {d}
                </button>
              ))}
              <button
                className={classNames(styles.keypadButton, styles.keypadToggleMode)}
                ref={r => (this.buttonRefs["toggle"] = r)}
                onClick={() => {
                  if (!hasTouchEvents) this.toggleMode();
                }}
              >
                {this.state.isAlphaMode ? "123" : "ABC"}
              </button>
              {!this.state.isAlphaMode && (
                <button
                  disabled={this.state.entered.length === this.maxAllowedChars()}
                  className={classNames(styles.keypadButton, styles.keypadZeroButton)}
                  ref={r => (this.buttonRefs["0"] = r)}
                  onClick={() => {
                    if (!hasTouchEvents) this.addToEntry(0);
                  }}
                >
                  0
                </button>
              )}
              <button
                disabled={this.state.entered.length === 0 || this.state.entered.length === this.maxAllowedChars()}
                className={classNames(styles.keypadButton, styles.keypadBackspace)}
                ref={r => (this.buttonRefs["remove"] = r)}
                onClick={() => {
                  if (!hasTouchEvents) this.removeChar();
                }}
              >
                ⌫
              </button>
            </div>

            <div className={styles.footer}>
              {!this.state.isAlphaMode && (
                <div
                  className={styles.linkHeadsetFooterLink}
                  style={{ visibility: this.state.isAlphaMode ? "hidden" : "visible" }}
                >
                  <img onClick={() => this.toggleMode()} src={HeadsetIcon} className={styles.headsetIcon} />
                  <span>
                    <a href="#" onClick={() => this.toggleMode()}>
                      <FormattedMessage id="link.linking_a_headset" />
                    </a>
                  </span>
                </div>
              )}
            </div>
            <div className={styles.createLink}>
              <a href="/">
                <FormattedMessage id="link.create_a_room" />
              </a>
            </div>
          </div>
        </div>
      </WrappedIntlProvider>
    );
  }
}

export default LinkRoot;
