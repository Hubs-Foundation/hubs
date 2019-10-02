import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import styles from "../assets/stylesheets/2d-hud.scss";
import uiStyles from "../assets/stylesheets/ui-root.scss";
import spritesheet from "../assets/images/spritesheets/css-spritesheet.css";
import { FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { micLevelForVolume } from "../components/audio-feedback";

const SPRITESHEET_ICONS = {
  MIC: [
    spritesheet.mic0,
    spritesheet.mic1,
    spritesheet.mic2,
    spritesheet.mic3,
    spritesheet.mic4,
    spritesheet.mic5,
    spritesheet.mic6,
    spritesheet.mic7
  ],
  MIC_OFF: [
    spritesheet.micOff0,
    spritesheet.micOff1,
    spritesheet.micOff2,
    spritesheet.micOff3,
    spritesheet.micOff4,
    spritesheet.micOff5,
    spritesheet.micOff6,
    spritesheet.micOff7
  ]
};

const noop = () => {};

class TopHUD extends Component {
  static propTypes = {
    scene: PropTypes.object,
    muted: PropTypes.bool,
    isCursorHoldingPen: PropTypes.bool,
    hasActiveCamera: PropTypes.bool,
    frozen: PropTypes.bool,
    watching: PropTypes.bool,
    onWatchEnded: PropTypes.func,
    videoShareMediaSource: PropTypes.string,
    showVideoShareFailed: PropTypes.bool,
    hideVideoShareFailedTip: PropTypes.func,
    activeTip: PropTypes.string,
    history: PropTypes.object,
    onToggleMute: PropTypes.func,
    onSpawnPen: PropTypes.func,
    onSpawnCamera: PropTypes.func,
    onShareVideo: PropTypes.func,
    onEndShareVideo: PropTypes.func,
    onShareVideoNotCapable: PropTypes.func,
    mediaSearchStore: PropTypes.object,
    isStreaming: PropTypes.bool,
    showStreamingTip: PropTypes.bool,
    hideStreamingTip: PropTypes.func
  };

  state = {
    showVideoShareOptions: false,
    lastActiveMediaSource: null,
    micLevel: 0,
    cameraDisabled: false,
    penDisabled: false,
    mediaDisabled: false
  };

  constructor(props) {
    super(props);
    this.state.cameraDisabled = !window.APP.hubChannel.can("spawn_camera");
    this.state.penDisabled = !window.APP.hubChannel.can("spawn_drawing");
    this.state.mediaDisabled = !window.APP.hubChannel.can("spawn_and_move_media");
  }

  onPermissionsUpdated = () => {
    this.setState({
      cameraDisabled: !window.APP.hubChannel.can("spawn_camera"),
      penDisabled: !window.APP.hubChannel.can("spawn_drawing"),
      mediaDisabled: !window.APP.hubChannel.can("spawn_and_move_media")
    });
  };

  componentDidMount = () => {
    let max = 0;
    if (this.micUpdateInterval) {
      clearInterval(this.micUpdateInterval);
    }
    this.micUpdateInterval = setInterval(() => {
      const volume = this.props.scene.systems["local-audio-analyser"].volume;
      max = Math.max(volume, max);
      const micLevel = micLevelForVolume(volume, max);
      if (micLevel !== this.state.micLevel) {
        this.setState({ micLevel });
      }
    }, 50);
    window.APP.hubChannel.addEventListener("permissions_updated", this.onPermissionsUpdated);
    this.onPermissionsUpdated();
  };

  componentWillUnmount = () => {
    if (this.micUpdateInterval) {
      clearInterval(this.micUpdateInterval);
    }
    window.APP.hubChannel.removeEventListener("permissions_updated", this.onPermissionsUpdated);
  };

  handleVideoShareClicked = source => {
    if (source === "screen" && !navigator.mediaDevices.getDisplayMedia) {
      this.props.onShareVideoNotCapable();
      return;
    }

    if (this.props.videoShareMediaSource) {
      this.props.onEndShareVideo();
    } else {
      this.props.onShareVideo(source);
      this.setState({ lastActiveMediaSource: source });
    }
  };

  buildVideoSharingButtons = () => {
    const isMobile = AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR();

    const videoShareExtraOptionTypes = [];
    const primaryVideoShareType =
      this.props.videoShareMediaSource || this.state.lastActiveMediaSource || (isMobile ? "camera" : "screen");

    if (this.state.showVideoShareOptions) {
      videoShareExtraOptionTypes.push(primaryVideoShareType);

      ["screen", "camera"].forEach(t => {
        if (videoShareExtraOptionTypes.indexOf(t) === -1) {
          videoShareExtraOptionTypes.push(t);
        }
      });
    }

    const showExtrasOnHover = () => {
      if (isMobile) return;

      clearTimeout(this.hideVideoSharingButtonTimeout);

      if (!this.props.videoShareMediaSource) {
        this.setState({ showVideoShareOptions: true });
      }
    };

    const hideExtrasOnOut = () => {
      this.hideVideoSharingButtonTimeout = setTimeout(() => {
        this.setState({ showVideoShareOptions: false });
      }, 250);
    };

    const maybeHandlePrimaryShare = () => {
      if (!this.state.showVideoShareOptions) {
        this.handleVideoShareClicked(primaryVideoShareType);
      }
    };

    const capitalize = str => str[0].toUpperCase() + str.slice(1);

    return (
      <div
        className={cx(styles.iconButton, styles[`share_${primaryVideoShareType}`], {
          [styles.active]: this.props.videoShareMediaSource === primaryVideoShareType,
          [styles.disabled]: this.state.mediaDisabled,
          [styles.videoShare]: true
        })}
        title={
          this.props.videoShareMediaSource !== null
            ? "Stop sharing"
            : `Share ${capitalize(primaryVideoShareType)}${this.state.mediaDisabled ? " Disabled" : ""}`
        }
        onClick={this.state.mediaDisabled ? noop : maybeHandlePrimaryShare}
        onMouseOver={this.state.mediaDisabled ? noop : showExtrasOnHover}
      >
        {videoShareExtraOptionTypes.length > 0 && (
          <div className={cx(styles.videoShareExtraOptions)} onMouseOut={hideExtrasOnOut}>
            {videoShareExtraOptionTypes.map(type => (
              <div
                key={type}
                className={cx(styles.iconButton, styles[`share_${type}`], {
                  [styles.active]: this.props.videoShareMediaSource === type,
                  [styles.disabled]: this.state.mediaDisabled
                })}
                title={
                  this.props.videoShareMediaSource === type
                    ? "Stop sharing"
                    : `Share ${capitalize(type)}${this.state.mediaDisabled ? " Disabled" : ""}`
                }
                onClick={this.state.mediaDisabled ? noop : () => this.handleVideoShareClicked(type)}
                onMouseOver={this.state.mediaDisabled ? noop : showExtrasOnHover}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  render() {
    const videoSharingButtons = this.buildVideoSharingButtons();
    const isMobile = AFRAME.utils.device.isMobile();
    const tipDivForType = (type, cancelFunc) => (
      <div className={cx(styles.topTip)}>
        {cancelFunc && (
          <button className={styles.tipCancel} onClick={cancelFunc}>
            <i>
              <FontAwesomeIcon icon={faTimes} />
            </i>
          </button>
        )}
        {!this.props.frozen && <div className={cx([styles.attachPoint, styles[`attach_${type.split(".")[1]}`]])} />}
        <FormattedMessage id={`tips.${type}`} />
      </div>
    );

    let tip;

    if (this.props.watching) {
      tip = (
        <div className={cx([styles.topTip, styles.topTipNoHud])}>
          <button className={styles.tipCancel} onClick={() => this.props.onWatchEnded()}>
            <i>
              <FontAwesomeIcon icon={faTimes} />
            </i>
          </button>
          <FormattedMessage id={`tips.${isMobile ? "mobile" : "desktop"}.watching`} />
          {!isMobile && (
            <button className={styles.tipCancelText} onClick={() => this.props.onWatchEnded()}>
              <FormattedMessage id="tips.watching.back" />
            </button>
          )}
        </div>
      );
    } else if (this.props.showVideoShareFailed) {
      tip = tipDivForType(`${isMobile ? "mobile" : "desktop"}.video_share_failed`, this.props.hideVideoShareFailedTip);
    } else if (this.props.activeTip) {
      tip = tipDivForType(this.props.activeTip);
    }

    const micLevel = this.state.micLevel;
    const micIconClass = this.props.muted ? SPRITESHEET_ICONS.MIC_OFF[micLevel] : SPRITESHEET_ICONS.MIC[micLevel];
    // Hide buttons when frozen.
    return (
      <div className={cx(styles.container, styles.top, styles.unselectable, uiStyles.uiInteractive)}>
        {this.props.frozen || this.props.watching ? (
          <div className={cx(uiStyles.uiInteractive, styles.panel)}>{tip}</div>
        ) : (
          <div className={cx(uiStyles.uiInteractive, styles.panel)}>
            {tip}
            {videoSharingButtons}
            <div
              className={cx(styles.iconButton, micIconClass)}
              title={this.props.muted ? "Unmute Mic" : "Mute Mic"}
              onClick={this.props.onToggleMute}
            />
            <button
              className={cx(uiStyles.uiInteractive, styles.iconButton, styles.spawn, {
                [styles.disabled]: this.state.mediaDisabled
              })}
              title={`Create${this.state.mediaDisabled ? " Disabled" : ""}`}
              onClick={
                this.state.mediaDisabled ? noop : () => this.props.mediaSearchStore.sourceNavigateToDefaultSource()
              }
            />
            <div
              className={cx(styles.iconButton, styles.pen, {
                [styles.active]: this.props.isCursorHoldingPen,
                [styles.disabled]: this.state.penDisabled
              })}
              title={`Pen${this.state.penDisabled ? " Disabled" : ""}`}
              onClick={this.state.penDisabled ? noop : this.props.onSpawnPen}
            />
            <div
              className={cx(styles.iconButton, styles.camera, {
                [styles.active]: this.props.hasActiveCamera,
                [styles.disabled]: this.state.cameraDisabled
              })}
              title={`Camera${this.state.cameraDisabled ? " Disabled" : ""}`}
              onClick={this.state.cameraDisabled ? noop : this.props.onSpawnCamera}
            />
          </div>
        )}
      </div>
    );
  }
}

export default { TopHUD };
