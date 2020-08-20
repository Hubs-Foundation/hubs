import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import styles from "../assets/stylesheets/2d-hud.scss";
import uiStyles from "../assets/stylesheets/ui-root.scss";
import { FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { micLevelForVolume } from "../components/audio-feedback";
import SpawnIcon from "../assets/images/spawn.svgi";
import ShareScreenIconActive from "../assets/images/share_screen_active.svgi";
import ShareScreenIcon from "../assets/images/share_screen.svgi";
import ShareCameraIconActive from "../assets/images/share_camera_active.svgi";
import ShareCameraIcon from "../assets/images/share_camera.svgi";
import PenIcon from "../assets/images/pen.svgi";
import PenIconActive from "../assets/images/pen_active.svgi";
import CameraIcon from "../assets/images/camera.svgi";
import CameraIconActive from "../assets/images/camera_active.svgi";
import Mic0 from "../assets/images/mic-0.svgi";
import Mic1 from "../assets/images/mic-1.svgi";
import Mic2 from "../assets/images/mic-2.svgi";
import Mic3 from "../assets/images/mic-3.svgi";
import Mic4 from "../assets/images/mic-4.svgi";
import Mic5 from "../assets/images/mic-5.svgi";
import Mic6 from "../assets/images/mic-6.svgi";
import Mic7 from "../assets/images/mic-7.svgi";
import MicOff0 from "../assets/images/mic-off-0.svgi";
import MicOff1 from "../assets/images/mic-off-1.svgi";
import MicOff2 from "../assets/images/mic-off-2.svgi";
import MicOff3 from "../assets/images/mic-off-3.svgi";
import MicOff4 from "../assets/images/mic-off-4.svgi";
import MicOff5 from "../assets/images/mic-off-5.svgi";
import MicOff6 from "../assets/images/mic-off-6.svgi";
import MicOff7 from "../assets/images/mic-off-7.svgi";

import { InlineSVG } from "./svgi";

const MIC_ICONS = {
  on: [Mic0, Mic1, Mic2, Mic3, Mic4, Mic5, Mic6, Mic7],
  off: [MicOff0, MicOff1, MicOff2, MicOff3, MicOff4, MicOff5, MicOff6, MicOff7]
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
    const iconForType = (type, active) => {
      if (active) {
        return type === "screen" ? ShareScreenIconActive : ShareCameraIconActive;
      } else {
        return type === "screen" ? ShareScreenIcon : ShareCameraIcon;
      }
    };

    return (
      <div
        className={cx(styles.iconButton, {
          [styles.disabled]: this.state.mediaDisabled,
          [styles.videoShare]: true
        })}
        title={
          this.props.videoShareMediaSource !== null
            ? "Stop sharing"
            : `Share ${capitalize(primaryVideoShareType)}${this.state.mediaDisabled ? " Disabled" : ""}`
        }
        role="button"
        onClick={this.state.mediaDisabled ? noop : maybeHandlePrimaryShare}
        onMouseOver={this.state.mediaDisabled ? noop : showExtrasOnHover}
      >
        <InlineSVG
          className={cx(styles.iconButtonIcon)}
          src={iconForType(primaryVideoShareType, this.props.videoShareMediaSource === primaryVideoShareType)}
        />
        {videoShareExtraOptionTypes.length > 0 && (
          <div className={cx(styles.videoShareExtraOptions)} onMouseOut={hideExtrasOnOut}>
            {videoShareExtraOptionTypes.map(type => (
              <div
                key={type}
                className={cx(styles.iconButton, {
                  [styles.disabled]: this.state.mediaDisabled
                })}
                title={
                  this.props.videoShareMediaSource === type
                    ? "Stop sharing"
                    : `Share ${capitalize(type)}${this.state.mediaDisabled ? " Disabled" : ""}`
                }
                onClick={this.state.mediaDisabled ? noop : () => this.handleVideoShareClicked(type)}
                onMouseOver={this.state.mediaDisabled ? noop : showExtrasOnHover}
              >
                <InlineSVG
                  className={cx(styles.iconButtonIcon)}
                  src={iconForType(type, this.props.videoShareMediaSource === type)}
                />
              </div>
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
          <button className={styles.tipCancel} aria-label="close" onClick={cancelFunc}>
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
          <button className={styles.tipCancel} aria-label="close" onClick={() => this.props.onWatchEnded()}>
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
    const micIcon = MIC_ICONS[this.props.muted ? "off" : "on"][micLevel];
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
              className={cx(styles.iconButton)}
              title={this.props.muted ? "Unmute Mic" : "Mute Mic"}
              role="button"
              onClick={this.props.onToggleMute}
            >
              <InlineSVG className={cx(styles.iconButtonIcon)} src={micIcon} />
            </div>
            <div
              className={cx(styles.iconButton, {
                [styles.disabled]: this.state.mediaDisabled
              })}
              title={`Create${this.state.mediaDisabled ? " Disabled" : ""}`}
              role="button"
              onClick={
                this.state.mediaDisabled ? noop : () => this.props.mediaSearchStore.sourceNavigateToDefaultSource()
              }
            >
              <InlineSVG className={cx(styles.iconButtonIcon, styles.spawn)} src={SpawnIcon} />
            </div>
            <div
              className={cx(styles.iconButton, {
                [styles.disabled]: this.state.penDisabled
              })}
              title={`Pen${this.state.penDisabled ? " Disabled" : ""}`}
              role="button"
              onClick={this.state.penDisabled ? noop : this.props.onSpawnPen}
            >
              <InlineSVG
                className={cx(styles.iconButtonIcon)}
                src={this.props.isCursorHoldingPen ? PenIconActive : PenIcon}
              />
            </div>
            <div
              className={cx(styles.iconButton, {
                [styles.disabled]: this.state.cameraDisabled
              })}
              title={`Camera${this.state.cameraDisabled ? " Disabled" : ""}`}
              role="button"
              onClick={this.state.cameraDisabled ? noop : this.props.onSpawnCamera}
            >
              <InlineSVG
                className={cx(styles.iconButtonIcon)}
                src={this.props.hasActiveCamera ? CameraIconActive : CameraIcon}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default { TopHUD };
