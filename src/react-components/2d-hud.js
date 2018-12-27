import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";

const { detect } = require("detect-browser");
import styles from "../assets/stylesheets/2d-hud.scss";
import uiStyles from "../assets/stylesheets/ui-root.scss";
import { WithHoverSound } from "./wrap-with-audio";
import { FormattedMessage } from "react-intl";

const browser = detect();

class TopHUD extends Component {
  static propTypes = {
    muted: PropTypes.bool,
    frozen: PropTypes.bool,
    videoShareMediaSource: PropTypes.string,
    onToggleMute: PropTypes.func,
    onToggleFreeze: PropTypes.func,
    onSpawnPen: PropTypes.func,
    onSpawnCamera: PropTypes.func,
    onShareVideo: PropTypes.func,
    onEndShareVideo: PropTypes.func,
    onShareVideoNotCapable: PropTypes.func
  };

  state = {
    showVideoShareOptions: false,
    lastActiveMediaSource: null
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
    const isMobile = AFRAME.utils.device.isMobile();

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
      <WithHoverSound>
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
          {this.props.videoShareMediaSource !== null && (
            <div className={cx(styles.videoShareNotify)}>
              <div className={cx(styles.attachPoint)} />
              <FormattedMessage id="video_share.notify" />
            </div>
          )}
          {videoShareExtraOptionTypes.length > 0 && (
            <div className={cx(styles.videoShareExtraOptions)} onMouseOut={hideExtrasOnOut}>
              {videoShareExtraOptionTypes.map(type => (
                <WithHoverSound key={type}>
                  <div
                    key={type}
                    className={cx(styles.iconButton, styles[`share_${type}`], {
                      [styles.active]: this.props.videoShareMediaSource === type
                    })}
                    title={this.props.videoShareMediaSource === type ? "Stop sharing" : `Share ${type}`}
                    onClick={() => this.handleVideoShareClicked(type)}
                    onMouseOver={showExtrasOnHover}
                  />
                </WithHoverSound>
              ))}
            </div>
          )}
        </div>
      </WithHoverSound>
    );
  };

  render() {
    const videoSharingButtons = this.buildVideoSharingButtons();

    return (
      <div className={cx(styles.container, styles.top, styles.unselectable, uiStyles.uiInteractive)}>
        <div className={cx(uiStyles.uiInteractive, styles.panel)}>
          {videoSharingButtons}
          <WithHoverSound>
            <div
              className={cx(styles.iconButton, styles.mute, { [styles.active]: this.props.muted })}
              title={this.props.muted ? "Unmute Mic" : "Mute Mic"}
              onClick={this.props.onToggleMute}
            />
          </WithHoverSound>
          <WithHoverSound>
            <div
              className={cx(styles.iconButton, styles.freeze, {
                [styles.active]: this.props.frozen
              })}
              title={this.props.frozen ? "Resume" : "Pause"}
              onClick={this.props.onToggleFreeze}
            />
          </WithHoverSound>
          <WithHoverSound>
            <div
              className={cx(styles.iconButton, styles.spawn_pen)}
              title={"Drawing Pen"}
              onClick={this.props.onSpawnPen}
            />
          </WithHoverSound>
          <WithHoverSound>
            <div
              className={cx(styles.iconButton, styles.spawn_camera)}
              title={"Camera"}
              onClick={this.props.onSpawnCamera}
            />
          </WithHoverSound>
        </div>
      </div>
    );
  }
}

const BottomHUD = ({ onCreateObject, showPhotoPicker, onMediaPicked }) => (
  <div className={cx(styles.container, styles.column, styles.bottom, styles.unselectable)}>
    {showPhotoPicker ? (
      <div className={cx(uiStyles.uiInteractive, styles.panel, styles.up)}>
        <input
          id="media-picker-input"
          className={cx(styles.hide)}
          type="file"
          accept="image/*"
          multiple
          onChange={e => {
            for (const file of e.target.files) {
              onMediaPicked(file);
            }
          }}
        />
        <label htmlFor="media-picker-input">
          <div className={cx(styles.iconButton, styles.mobileMediaPicker)} title={"Pick Media"} />
        </label>
      </div>
    ) : (
      <div />
    )}
    <div>
      <WithHoverSound>
        <div
          className={cx(uiStyles.uiInteractive, styles.iconButton, styles.large, styles.createObject)}
          title={"Create Object"}
          onClick={onCreateObject}
        />
      </WithHoverSound>
    </div>
  </div>
);

BottomHUD.propTypes = {
  onCreateObject: PropTypes.func,
  showPhotoPicker: PropTypes.bool,
  onMediaPicked: PropTypes.func
};

export default { TopHUD, BottomHUD };
