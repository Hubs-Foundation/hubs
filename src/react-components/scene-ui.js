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
    sceneAttribution: PropTypes.string,
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
        </div>
      </IntlProvider>
    );
  }
}

export default SceneUI;
