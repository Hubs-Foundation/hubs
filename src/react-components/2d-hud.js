import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";

const { detect } = require("detect-browser");
import styles from "../assets/stylesheets/2d-hud.scss";
import uiStyles from "../assets/stylesheets/ui-root.scss";
import spritesheet from "../assets/images/spritesheets/css-sprites-spritesheet.css";
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
const ICONS = {
  MIC: [styles.mic0, styles.mic1, styles.mic2, styles.mic3, styles.mic4, styles.mic5, styles.mic6, styles.mic7],
  MIC_OFF: [
    styles.micOff0,
    styles.micOff1,
    styles.micOff2,
    styles.micOff3,
    styles.micOff4,
    styles.micOff5,
    styles.micOff6,
    styles.micOff7
  ]
};
const browser = detect();

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
    activeTip: PropTypes.string,
    history: PropTypes.object,
    onToggleMute: PropTypes.func,
    onToggleFreeze: PropTypes.func,
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
    micLevel: 0
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
  };
  componentWillUnmount = () => {
    if (this.micUpdateInterval) {
      clearInterval(this.micUpdateInterval);
    }
  };

  handleVideoShareClicked = source => {
    if ((source === "screen" || source === "window") && browser.name !== "firefox") {
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

      ["screen", "window", "camera"].forEach(t => {
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

    return (
      <div
        className={cx(styles.iconButton, styles[`share_${primaryVideoShareType}`], {
          [styles.active]: this.props.videoShareMediaSource === primaryVideoShareType,
          [styles.videoShare]: true
        })}
        title={this.props.videoShareMediaSource !== null ? "Stop sharing" : `Share ${primaryVideoShareType}`}
        onClick={() => {
          if (!this.state.showVideoShareOptions) {
            this.handleVideoShareClicked(primaryVideoShareType);
          }
        }}
        onMouseOver={showExtrasOnHover}
      >
        {videoShareExtraOptionTypes.length > 0 && (
          <div className={cx(styles.videoShareExtraOptions)} onMouseOut={hideExtrasOnOut}>
            {videoShareExtraOptionTypes.map(type => (
              <div
                key={type}
                className={cx(styles.iconButton, styles[`share_${type}`], {
                  [styles.active]: this.props.videoShareMediaSource === type
                })}
                title={this.props.videoShareMediaSource === type ? "Stop sharing" : `Share ${type}`}
                onClick={() => this.handleVideoShareClicked(type)}
                onMouseOver={showExtrasOnHover}
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
    } else if (this.props.activeTip) {
      tip = this.props.activeTip && (
        <div className={cx(styles.topTip)}>
          {!this.props.frozen && (
            <div className={cx([styles.attachPoint, styles[`attach_${this.props.activeTip.split(".")[1]}`]])} />
          )}
          <FormattedMessage id={`tips.${this.props.activeTip}`} />
        </div>
      );
    }

    const micLevel = this.state.micLevel;
    const icons = window.useSpritesheetIcons ? SPRITESHEET_ICONS : ICONS;
    const micIconClass = this.props.muted ? icons.MIC_OFF[micLevel] : icons.MIC[micLevel];
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
              className={cx(styles.iconButton, { [micIconClass]: !window.useSpritesheetIcons })}
              title={this.props.muted ? "Unmute Mic" : "Mute Mic"}
              onClick={this.props.onToggleMute}
            >
              <div
                className={cx(
                  { [micIconClass]: window.useSpritesheetIcons },
                  { [styles.sprite]: window.useSpritesheetIcons }
                )}
              />
            </div>
            <button
              className={cx(uiStyles.uiInteractive, styles.iconButton, styles.spawn)}
              onClick={() => this.props.mediaSearchStore.sourceNavigateToDefaultSource()}
            />
            <div
              className={cx(styles.iconButton, styles.pen, { [styles.active]: this.props.isCursorHoldingPen })}
              title={"Pen"}
              onClick={this.props.onSpawnPen}
            />
            <div
              className={cx(styles.iconButton, styles.camera, { [styles.active]: this.props.hasActiveCamera })}
              title={"Camera"}
              onClick={this.props.onSpawnCamera}
            />
          </div>
        )}
      </div>
    );
  }
}

export default { TopHUD };
