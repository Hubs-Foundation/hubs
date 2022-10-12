import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { WrappedIntlProvider } from "./wrapped-intl-provider";
import configs from "../utils/configs";
import classNames from "classnames";
import styles from "../assets/stylesheets/link.scss";
import { disableiOSZoom } from "../utils/disable-ios-zoom";

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
    // Alpha keys A-I
    if (e.keyCode < 65 || e.keyCode > 73) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    this.addToEntry("IHGFEDCBA"[73 - e.keyCode]);
  };

  addToEntry = ch => {
    if (this.state.entered.length >= MAX_LETTERS) return;
    const newChars = `${this.state.entered}${ch}`;

    this.setState({ entered: newChars }, () => {
      if (this.state.entered.length === MAX_LETTERS) {
        this.attemptLink(this.state.entered);
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

  render() {
    // Note we use type "tel" for the input due to https://bugzilla.mozilla.org/show_bug.cgi?id=1005603

    return (
      <WrappedIntlProvider>
        <div className={styles.link}>
          <div className={styles.linkContents}>
            <a className={styles.logo} href="/">
              <img
                src={configs.image("logo")}
                alt={<FormattedMessage id="link-page.logo-alt" defaultMessage="Logo" />}
              />
            </a>
            {this.state.entered.length === MAX_LETTERS && (
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
                {this.state.failedAtLeastOnce ? (
                  <FormattedMessage
                    id="link-page.try-again"
                    defaultMessage="We couldn't find that code.{linebreak}Please try again."
                    values={{ linebreak: <br /> }}
                  />
                ) : (
                  <FormattedMessage id="link-page.enter-code" defaultMessage="Enter code:" />
                )}
              </div>

              <div className={styles.entered}>
                <input
                  className={styles.charInput}
                  type="text"
                  pattern="[0-9A-I]*"
                  value={this.state.entered}
                  onChange={ev => {
                    this.setState({ entered: ev.target.value.toUpperCase() }, () => {
                      if (this.state.entered.length === MAX_LETTERS) {
                        this.attemptLink(this.state.entered);
                      }
                    });
                  }}
                />
              </div>
            </div>

            <div className={styles.keypad}>
              {["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((d, i) => (
                <button
                  disabled={this.state.entered.length === MAX_LETTERS}
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
                disabled={this.state.entered.length === 0 || this.state.entered.length === MAX_LETTERS}
                className={classNames(styles.keypadButton, styles.keypadBackspace)}
                ref={r => (this.buttonRefs["remove"] = r)}
                onClick={() => {
                  if (!hasTouchEvents) this.removeChar();
                }}
              >
                ⌫
              </button>
            </div>

            <div className={styles.createLink}>
              <a href="/">
                <FormattedMessage id="link-page.create-room-button" defaultMessage="Create a new room" />
              </a>
            </div>
          </div>
        </div>
      </WrappedIntlProvider>
    );
  }
}

export default LinkRoot;
