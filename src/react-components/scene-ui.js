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
import CreateRoomDialog from "./create-room-dialog.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons/faEllipsisH";

import { lang, messages } from "../utils/i18n";

addLocaleData([...en]);

class SceneUI extends Component {
  static propTypes = {
    scene: PropTypes.object,
    sceneLoaded: PropTypes.bool,
    sceneId: PropTypes.string,
    sceneName: PropTypes.string,
    sceneDescription: PropTypes.string,
    sceneAttribution: PropTypes.string,
    sceneScreenshotURL: PropTypes.string
  };

  state = {
    showScreenshot: false,
    showCustomRoomDialog: false
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
    const payload = { hub: { name: this.state.customRoomName || generateHubName(), scene_id: this.props.sceneId } };
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
              <div className={styles.createButtons}>
                <button className={styles.createButton} onClick={this.createRoom}>
                  <FormattedMessage id="scene.create_button" />
                </button>
                <button className={styles.optionsButton} onClick={() => this.setState({ showCustomRoomDialog: true })}>
                  <FontAwesomeIcon icon={faEllipsisH} />
                </button>
              </div>
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
            <div className={styles.attribution}>{this.props.sceneAttribution}</div>
          </div>
          <div className={styles.spoke}>
            <div className={styles.madeWith}>made with</div>
            <a href="/spoke">
              <img src={spokeLogo} />
            </a>
          </div>
          {this.state.showCustomRoomDialog && (
            <CreateRoomDialog
              includeScenePrompt={false}
              onClose={() => this.setState({ showCustomRoomDialog: false })}
              onCustomScene={name => {
                this.setState({ showCustomRoomDialog: false, customRoomName: name }, () => this.createRoom());
              }}
            />
          )}
        </div>
      </IntlProvider>
    );
  }
}

export default SceneUI;
