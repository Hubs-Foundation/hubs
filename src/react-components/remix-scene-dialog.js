import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";

import styles from "../assets/stylesheets/remix-scene-dialog.scss";
import DialogContainer from "./dialog-container";
import { getPlatform, fetchRelease, releasesLink } from "../utils/spoke-download-link";

const Steps = {
  DownloadSpoke: "download-spoke",
  DownloadScene: "download-scene",
  OpenScene: "open-scene"
};

export default class RemixSceneDialog extends Component {
  static propTypes = {
    sceneUrl: PropTypes.string,
    onClose: PropTypes.func
  };

  state = {
    step: Steps.DownloadSpoke,
    platform: getPlatform(),
    downloadUrl: releasesLink
  };

  componentDidMount() {
    if (this.state.platform === "unsupported") {
      return;
    }

    fetchRelease(this.state.platform).then(release => {
      if (release) {
        this.setState({
          downloadUrl: release.downloadUrl
        });
      }
    });
  }

  renderDownloadSpokeStep() {
    return (
      <div className={styles.remixSceneContainer}>
        <FormattedMessage id="remix-scene-dialog.spoke-description" />
        <a
          download
          href={this.state.downloadUrl}
          className={styles.downloadButton}
          onClick={() => this.setState({ step: Steps.DownloadScene })}
        >
          <FormattedMessage id={"remix-scene-dialog.download-spoke-button-" + this.state.platform} />
        </a>
        <button className={styles.nextButton} onClick={() => this.setState({ step: Steps.DownloadScene })}>
          <FormattedMessage id="remix-scene-dialog.skip-button" />
        </button>
      </div>
    );
  }

  renderDownloadSceneStep() {
    return (
      <div className={styles.remixSceneContainer}>
        <FormattedMessage id="remix-scene-dialog.scene-description" />
        <button className={styles.backButton} onClick={() => this.setState({ step: Steps.DownloadSpoke })}>
          <FormattedMessage id="remix-scene-dialog.back-button" />
        </button>
        <button className={styles.nextButton} onClick={() => this.setState({ step: Steps.OpenScene })}>
          <FormattedMessage id="remix-scene-dialog.download-scene-button" />
        </button>
      </div>
    );
  }

  renderOpenSceneStep() {
    return (
      <div className={styles.remixSceneContainer}>
        <FormattedMessage id="remix-scene-dialog.open-scene-description" />
        <button className={styles.backButton} onClick={() => this.setState({ step: Steps.DownloadScene })}>
          <FormattedMessage id="remix-scene-dialog.back-button" />
        </button>
        <button className={styles.nextButton} onClick={this.props.onClose}>
          <FormattedMessage id="remix-scene-dialog.close-button" />
        </button>
      </div>
    );
  }

  render() {
    const step = this.state.step;

    return (
      <DialogContainer title="Remix Scene" {...this.props}>
        {step === Steps.DownloadSpoke && this.renderDownloadSpokeStep()}
        {step === Steps.DownloadScene && this.renderDownloadSceneStep()}
        {step === Steps.OpenScene && this.renderOpenSceneStep()}
      </DialogContainer>
    );
  }
}
