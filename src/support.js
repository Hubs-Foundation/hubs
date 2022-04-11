/* eslint-disable @calm/react-intl/missing-formatted-message */

/*
NOTE: support.js needs to be as self-contained as possible, since it needs to work in legacy browers
that we do not support. Avoid adding imports to libraries or other modules from our own codebase
that might break the support UI in legacy browsers.
We also do not support localization in this file, since it would require additional transpiliation
and polyfilling.
*/

import React from "react";
import ReactDOM from "react-dom";
import copy from "copy-to-clipboard";
import { detectOS } from "detect-browser";
import "./react-components/styles/global.scss";
import styles from "./assets/stylesheets/support.scss";

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
    {
      name: "Modern JavaScript Syntax",
      supported:
        syntaxSupported(CATCH_SYNTAX) && syntaxSupported(SPREAD_SYNTAX) && syntaxSupported(SHORTHAND_INITIALIZER)
    }
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
      <div className={styles.supportMain}>
        <div className={styles.supportContent}>
          <h1>Mozilla Hubs</h1>
          <br />
          <p className={styles.unsupportedLangs}>
            · <span>Unsupported</span> · <span>No Soportado</span> · <span>Nicht Unterstützt</span>
            {" · "}
            <span>Sem Suporte</span> · <span>Non Compatible</span> · <span>不支援</span>
            {" · "}
            <span>не поддерживается</span> · <span>サポートされていません</span> ·
          </p>
          <br />
          <p>
            <span>Your browser is missing required features.</span>
            <br />
            {inAppBrowser ? (
              detectedOS === "iOS" ? (
                <span>Copy and paste this link directly into Safari</span>
              ) : (
                <span>Copy and paste this link directly into Chrome or Firefox</span>
              )
            ) : (
              <span>Please try switching or updating to a newer browser</span>
            )}
            <br />
            <br />
            <input type="text" readOnly onFocus={e => e.target.select()} value={document.location} />
            <a className="copy-link" href="#" onClick={this.onCopyClicked}>
              {this.state.hasCopied ? "copied!" : "copy"}
            </a>
            <br />
            <br />
            <a className={styles.detailsLink} href="#" onClick={this.toggleDetails}>
              <span>details</span>
            </a>
          </p>
          {this.state.showDetails && (
            <table className={styles.details}>
              <tbody>
                {platformSupport.sort((a, b) => (a.supported && !b.supported ? 1 : -1)).map(s => (
                  <tr key={s.name}>
                    <td>{s.name}</td>
                    <td>{s.supported ? "supported" : "unsupported"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<Support />, document.getElementById("support-root"));
});
