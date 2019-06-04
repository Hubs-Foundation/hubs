import React, { Component } from "react";
import PropTypes from "prop-types";
import hubLogo from "../assets/images/hub-preview-white.png";
import styles from "../assets/stylesheets/embed-treatment.scss";
import { FormattedMessage } from "react-intl";

export default class EmbedTreatment extends Component {
  static propTypes = {
    hubName: PropTypes.string,
    hubScene: PropTypes.object,
    onEmbedLoadClicked: PropTypes.func
  };

  render() {
    return (
      <div className={styles.treatment}>
        <div className={styles.screenshot}>
          <img className={styles.screenshot} src={this.props.hubScene.screenshot_url} />
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className={styles.logo}>
          <img src={hubLogo} />
        </a>
        <div className={styles.mainPanel}>
          <div className={styles.hubName}>{this.props.hubName}</div>
          <button className={styles.loadButton} onClick={this.props.onEmbedLoadClicked}>
            <FormattedMessage id="embed.load-button" />
          </button>
        </div>
      </div>
    );
  }
}
