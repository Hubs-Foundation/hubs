import React, { Component } from "react";
import PropTypes from "prop-types";
//import classNames from "classnames";
import { IntlProvider, /*FormattedMessage, */ addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import styles from "../assets/stylesheets/scene-ui.scss";

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

  onSceneLoaded = () => {
    this.setState({ sceneLoaded: true });
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
        <div className={styles.ui}>hello</div>
      </IntlProvider>
    );
  }
}

export default SceneUI;
