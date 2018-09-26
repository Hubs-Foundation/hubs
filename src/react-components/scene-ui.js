import React, { Component } from "react";
import PropTypes from "prop-types";
//import classNames from "classnames";
import { IntlProvider, FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import styles from "../assets/stylesheets/scene-ui.scss";
import hubLogo from "../assets/images/hub-preview-white.png";
import { getReticulumFetchUrl } from "../utils/phoenix-utils";
import { generateHubName } from "../utils/name-generation";

import { lang, messages } from "../utils/i18n";

addLocaleData([...en]);

class SceneUI extends Component {
  static propTypes = {
    store: PropTypes.object,
    scene: PropTypes.object,
    sceneLoaded: PropTypes.bool,
    sceneId: PropTypes.string,
    sceneName: PropTypes.string,
    sceneDescription: PropTypes.string,
    sceneAttribution: PropTypes.string
  };

  state = {};

  constructor(props) {
    super(props);
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
    if (!this.props.sceneLoaded || !this.props.sceneId) {
      return (
        <IntlProvider locale={lang} messages={messages}>
          <div className="loading-panel">
            <div className="loader-wrap">
              <div className="loader">
                <div className="loader-center" />
              </div>
            </div>

            <img className="loading-panel__logo" src="../assets/images/logo.svg" />
          </div>
        </IntlProvider>
      );
    }

    return (
      <IntlProvider locale={lang} messages={messages}>
        <div className={styles.ui}>
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
          <div className={styles.description}>{this.props.sceneDescription}</div>
        </div>
      </IntlProvider>
    );
  }
}

export default SceneUI;
