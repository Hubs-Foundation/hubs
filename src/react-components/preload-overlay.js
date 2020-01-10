import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";

import configs from "../utils/configs";
import styles from "../assets/stylesheets/preload-overlay.scss";

const isMobile = AFRAME.utils.device.isMobile();

export default class PreloadOverlay extends Component {
  static propTypes = {
    hubName: PropTypes.string,
    hubScene: PropTypes.object,
    baseUrl: PropTypes.string,
    onLoadClicked: PropTypes.func
  };

  render() {
    return (
      <div className={styles.treatment}>
        <div className={styles.screenshot}>
          {this.props.hubScene && <img className={styles.screenshot} src={this.props.hubScene.screenshot_url} />}
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className={styles.logo}>
          <img src={configs.image("logo")} />
        </a>
        <div className={styles.mainPanel}>
          <div className={styles.hubName}>{this.props.hubName}</div>
          {this.props.onLoadClicked &&
            (!isMobile ? (
              <button className={styles.loadButton} onClick={this.props.onLoadClicked}>
                <FormattedMessage id="embed.load-button" />
              </button>
            ) : (
              <a href={this.props.baseUrl} target="_blank" className={styles.loadButton} rel="noreferrer noopener">
                <FormattedMessage id="embed.load-button" />
              </a>
            ))}
        </div>
      </div>
    );
  }
}
