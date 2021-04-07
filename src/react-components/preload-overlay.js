import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";

import configs from "../utils/configs";
import styles from "../assets/stylesheets/preload-overlay.scss";
import { Button } from "./input/Button";

const isMobile = AFRAME.utils.device.isMobile();

export default class PreloadOverlay extends Component {
  static propTypes = {
    hubName: PropTypes.string,
    hubScene: PropTypes.object,
    baseUrl: PropTypes.string,
    onLoadClicked: PropTypes.func
  };

  render() {
    const loadButtonText = <FormattedMessage id="preload-overlay.load-button" defaultMessage="Load Room" />;

    return (
      <div className={styles.treatment}>
        <div className={styles.screenshot}>
          {this.props.hubScene && <img className={styles.screenshot} src={this.props.hubScene.screenshot_url} />}
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className={styles.logo}>
          <img
            src={configs.image("logo")}
            alt={<FormattedMessage id="preload-overlay.logo-alt" defaultMessage="Logo" />}
          />
        </a>
        <div className={styles.mainPanel}>
          <div className={styles.hubName}>{this.props.hubName}</div>
          {this.props.onLoadClicked &&
            (!isMobile ? (
              <Button preset="primary" onClick={this.props.onLoadClicked}>
                {loadButtonText}
              </Button>
            ) : (
              <Button preset="primary" as="a" href={this.props.baseUrl} target="_blank" rel="noreferrer noopener">
                {loadButtonText}
              </Button>
            ))}
        </div>
      </div>
    );
  }
}
