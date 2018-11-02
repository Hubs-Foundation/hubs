import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import styles from "../assets/stylesheets/scene-ui.scss";
import hubLogo from "../assets/images/hub-preview-white.png";
import spokeLogo from "../assets/images/spoke_logo_black.png";
import { getReticulumFetchUrl } from "../utils/phoenix-utils";
import { generateHubName } from "../utils/name-generation";

import { lang, messages } from "../utils/i18n";

addLocaleData([...en]);

class SceneUI extends Component {
  static propTypes = {
    scene: PropTypes.object,
    sceneLoaded: PropTypes.bool,
    sceneId: PropTypes.string,
    sceneName: PropTypes.string,
    sceneDescription: PropTypes.string,
    sceneAttributions: PropTypes.object,
    sceneScreenshotURL: PropTypes.string
  };

  state = {
    showScreenshot: false
  };

  constructor(props) {
    super(props);

    // Show screenshot if scene isn't loaded in 5 seconds
    setTimeout(() => {
      if (!this.props.sceneLoaded) {
        this.setState({ showScreenshot: true });
      }
    }, 5000);
  }

  componentDidMount() {
    this.props.scene.addEventListener("loaded", this.onSceneLoaded);
  }

  componentWillUnmount() {
    this.props.scene.removeEventListener("loaded", this.onSceneLoaded);
  }

  createRoom = async () => {
    const payload = { hub: { name: generateHubName(), scene_id: this.props.sceneId } };
    const createUrl = getReticulumFetchUrl("/api/v1/hubs");

    const res = await fetch(createUrl, {
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
      method: "POST"
    });

    const hub = await res.json();

    if (!process.env.RETICULUM_SERVER || document.location.host === process.env.RETICULUM_SERVER) {
      document.location = hub.url;
    } else {
      document.location = `/hub.html?hub_id=${hub.hub_id}`;
    }
  };

  render() {
    const sceneUrl = [location.protocol, "//", location.host, location.pathname].join("");
    const tweetText = `${this.props.sceneName} in #hubs`;
    const tweetLink = `https://twitter.com/share?url=${encodeURIComponent(sceneUrl)}&text=${encodeURIComponent(
      tweetText
    )}`;

    let attributions;

    const toAttributionSpan = a => {
      if (a.url) {
        const source = a.url.indexOf("sketchfab.com")
          ? "on Sketchfab"
          : a.url.indexOf("poly.google.com")
            ? "on Google Poly"
            : "";

        return (
          <span key={a.url}>
            <a href={a.url} target="_blank" rel="noopener noreferrer">
              {a.name} by {a.author} {source}
            </a>&nbsp;
          </span>
        );
      } else {
        return (
          <span key={`${a.name} ${a.author}`}>
            {a.name} by {a.author}&nbsp;
          </span>
        );
      }
    };

    if (this.props.sceneAttributions) {
      if (!this.props.sceneAttributions.extras) {
        attributions = (
          <span>
            <span>by {this.props.sceneAttributions.creator}</span>&nbsp;
            <br />
            {this.props.sceneAttributions.content && this.props.sceneAttributions.content.map(toAttributionSpan)}
          </span>
        );
      } else {
        // Legacy
        attributions = <span>{this.props.sceneAttributions.extras}</span>;
      }
    }

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={styles.ui}>
          <div
            className={classNames({
              [styles.screenshot]: true,
              [styles.screenshotHidden]: this.props.sceneLoaded
            })}
          >
            {this.state.showScreenshot && <img src={this.props.sceneScreenshotURL} />}
          </div>
          <div className={styles.whiteOverlay} />
          <div className={styles.grid}>
            <div className={styles.mainPanel}>
              <a href="/" className={styles.logo}>
                <img src={hubLogo} />
              </a>
              <div className={styles.logoTagline}>
                <FormattedMessage id="scene.logo_tagline" />
              </div>
              <button onClick={this.createRoom}>
                <FormattedMessage id="scene.create_button" />
              </button>
              <a href={tweetLink} rel="noopener noreferrer" target="_blank" className={styles.tweetButton}>
                <img src="../assets/images/twitter.svg" />
                <div>
                  <FormattedMessage id="scene.tweet_button" />
                </div>
              </a>
            </div>
          </div>
          <div className={styles.info}>
            <div className={styles.name}>{this.props.sceneName}</div>
            <div className={styles.attribution}>{attributions}</div>
          </div>
          <div className={styles.spoke}>
            <div className={styles.madeWith}>made with</div>
            <a href="/spoke">
              <img src={spokeLogo} />
            </a>
          </div>
        </div>
      </IntlProvider>
    );
  }
}

export default SceneUI;
