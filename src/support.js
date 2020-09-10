/*
NOTE: support.js needs to be as self-contained as possible, since it needs to work in legacy browers
that we do not support. Avoid adding imports to libraries or other modules from our own codebase
that might break the support UI in legacy browsers.
*/

import React from "react";
import ReactDOM from "react-dom";
import copy from "copy-to-clipboard";
import { detectOS } from "detect-browser";
import { FormattedMessage } from "react-intl";
import { WrappedIntlProvider } from "./react-components/wrapped-intl-provider";
import styles from "./assets/stylesheets/support.scss";
import configs from "./utils/configs";

const SHORTHAND_INITIALIZER = "var foo = 'bar'; var baz = { foo };";
const SPREAD_SYNTAX = "var foo = {}; var baz = { ...foo };";
const CATCH_SYNTAX = "try { foo(); } catch {}";

function syntaxSupported(syntax) {
  try {
    eval(syntax);
    return true;
  } catch (e) {
    return false;
  }
}

function getPlatformSupport() {
  return [
    { name: "Web Assembly", supported: !!window.WebAssembly },
    { name: "Media Devices", supported: !!navigator.mediaDevices },
    { name: "Shorthand initializer syntax", supported: syntaxSupported(SHORTHAND_INITIALIZER) },
    { name: "Spread syntax", supported: syntaxSupported(SPREAD_SYNTAX) },
    { name: "Optional catch syntax", supported: syntaxSupported(CATCH_SYNTAX) }
  ];
}

function isInAppBrowser() {
  // Some apps like Twitter, Discord and Facebook on Android and iOS open links in
  // their own embedded preview browsers.
  //
  // On iOS this WebView does not have a mediaDevices API at all, but in Android apps
  // like Facebook, the browser pretends to have a mediaDevices, but never actually
  // prompts the user for device access. So, we show a dialog that tells users to open
  // the room in an actual browser like Safari, Chrome or Firefox.
  //
  // Facebook Mobile Browser on Android has a userAgent like this:
  // Mozilla/5.0 (Linux; Android 9; SM-G950U1 Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko)
  // Version/4.0 Chrome/80.0.3987.149 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/262.0.0.34.117;]
  const detectedOS = detectOS(navigator.userAgent);
  return (detectedOS === "iOS" && !navigator.mediaDevices) || /\bfb_iab\b/i.test(navigator.userAgent);
}

export function platformUnsupported() {
  return getPlatformSupport().some(s => !s.supported) || isInAppBrowser();
}

class Support extends React.Component {
  state = { showDetails: false, hasCopied: false };
  toggleDetails = e => {
    e.preventDefault();
    this.setState(state => {
      state.showDetails = !state.showDetails;
      return state;
    });
  };
  onCopyClicked = e => {
    e.preventDefault();
    copy(document.location);
    this.setState({ hasCopied: true });
  };
  render() {
    const platformSupport = getPlatformSupport();
    const allSupported = platformSupport.every(s => s.supported);
    const inAppBrowser = isInAppBrowser();

    if (allSupported && !inAppBrowser) return null;

    const detectedOS = detectOS(navigator.userAgent);

    return (
      <WrappedIntlProvider>
        <div className={styles.supportMain}>
          <div className={styles.supportContent}>
            <div>
              <img className={styles.logo} src={configs.image("logo")} />
            </div>
            <p>
              <FormattedMessage id="support.missing-features" />
              <br />
              {inAppBrowser ? (
                <FormattedMessage
                  id={detectedOS === "iOS" ? "support.in-app-browser-ios" : "support.in-app-browser-android"}
                />
              ) : (
                <FormattedMessage id="support.update-browser" />
              )}
              <br />
              <br />
              <input type="text" readOnly onFocus={e => e.target.select()} value={document.location} />
              <a className="copy-link" href="#" onClick={this.onCopyClicked}>
                <FormattedMessage id={this.state.hasCopied ? "support.copied" : "support.copy"} />
              </a>
              <br />
              <br />
              <a className={styles.detailsLink} href="#" onClick={this.toggleDetails}>
                <FormattedMessage id="support.details" />
              </a>
            </p>
            {this.state.showDetails && (
              <table className={styles.details}>
                <tbody>
                  {platformSupport.sort((a, b) => (a.supported && !b.supported ? 1 : -1)).map(s => (
                    <tr key={s.name}>
                      <td>{s.name}</td>
                      <td>
                        <FormattedMessage id={s.supported ? "support.supported" : "support.unsupported"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </WrappedIntlProvider>
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<Support />, document.getElementById("support-root"));
});
