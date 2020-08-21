import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { WrappedIntlProvider } from "./wrapped-intl-provider";
import UnlessFeature from "./unless-feature";

import configs from "../utils/configs";
import loaderStyles from "../assets/stylesheets/loader.scss";

class Loader extends Component {
  static propTypes = {
    scene: PropTypes.object,
    finished: PropTypes.bool,
    onLoaded: PropTypes.func
  };

  doneWithInitialLoad = false;
  state = {
    loadingNum: 0,
    loadedNum: 0
  };

  componentDidMount() {
    this.props.scene.addEventListener("model-loading", this.onObjectLoading);
    this.props.scene.addEventListener("image-loading", this.onObjectLoading);
    this.props.scene.addEventListener("pdf-loading", this.onObjectLoading);
    this.props.scene.addEventListener("model-loaded", this.onObjectLoaded);
    this.props.scene.addEventListener("image-loaded", this.onObjectLoaded);
    this.props.scene.addEventListener("pdf-loaded", this.onObjectLoaded);
    this.props.scene.addEventListener("model-error", this.onObjectLoaded);
    this.props.scene.addEventListener(
      "environment-scene-loaded",
      () => {
        this.environmentSceneLoaded = true;
        this.tryFinishLoading();
      },
      { once: true }
    );
  }

  componentWillUnmount() {
    this.props.scene.removeEventListener("model-loading", this.onObjectLoading);
    this.props.scene.removeEventListener("image-loading", this.onObjectLoading);
    this.props.scene.removeEventListener("pdf-loading", this.onObjectLoading);
    this.props.scene.removeEventListener("model-loaded", this.onObjectLoaded);
    this.props.scene.removeEventListener("image-loaded", this.onObjectLoaded);
    this.props.scene.removeEventListener("pdf-loaded", this.onObjectLoaded);
    this.props.scene.removeEventListener("model-error", this.onObjectLoaded);
  }

  onObjectLoading = () => {
    if (!this.doneWithInitialLoad && this.loadingTimeout) {
      window.clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }

    this.setState(state => {
      return { loadingNum: state.loadingNum + 1 };
    });
  };

  onObjectLoaded = () => {
    this.setState(state => {
      return { loadedNum: state.loadedNum + 1 };
    });

    this.tryFinishLoading();
  };

  tryFinishLoading = () => {
    if (!this.doneWithInitialLoad && this.loadingTimeout) window.clearTimeout(this.loadingTimeout);

    if (this.environmentSceneLoaded) {
      this.loadingTimeout = window.setTimeout(() => {
        this.doneWithInitialLoad = true;
        if (this.props.onLoaded) {
          this.props.onLoaded();
        }
      }, 1500);
    }
  };

  render() {
    const nomore = (
      <h4 className={loaderStyles.loadingText}>
        <FormattedMessage id="loader.entering_lobby" />
      </h4>
    );
    const progress =
      this.state.loadingNum === 0
        ? " "
        : `${Math.min(this.state.loadedNum, this.state.loadingNum)} / ${this.state.loadingNum} `;
    const usual = (
      <h4 className={loaderStyles.loadingText}>
        <FormattedMessage id="loader.loading" />
        {progress}
        <FormattedMessage id={this.state.loadingNum !== 1 ? "loader.objects" : "loader.object"} />
        ...
      </h4>
    );
    return (
      <WrappedIntlProvider>
        <div className="loading-panel">
          <img className="loading-panel__logo" src={configs.image("logo")} />
          <UnlessFeature name="hide_powered_by">
            <div className="loading-panel__powered-by">
              <span className="loading-panel__powered-by__prefix">
                <FormattedMessage id="home.powered_by_prefix" />
              </span>
              <a href="https://hubs.mozilla.com/cloud">
                <FormattedMessage id="home.powered_by_link" />
              </a>
            </div>
          </UnlessFeature>

          {this.props.finished ? nomore : usual}

          <div className="loader-wrap loader-bottom">
            <div className="loader">
              <div className="loader-center" />
            </div>
          </div>
        </div>
      </WrappedIntlProvider>
    );
  }
}

export default Loader;
