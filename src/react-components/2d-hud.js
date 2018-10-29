import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import styles from "../assets/stylesheets/2d-hud.scss";
import uiStyles from "../assets/stylesheets/ui-root.scss";

class TopHUD extends Component {
  static propTypes = {
    muted: PropTypes.bool,
    frozen: PropTypes.bool,
    videoShareSource: PropTypes.bool,
    onToggleMute: PropTypes.func,
    onToggleFreeze: PropTypes.func,
    onSpawnPen: PropTypes.func,
    onSpawnCamera: PropTypes.func,
    onShareVideo: PropTypes.func
  };

  state = {
    showVideoShareOptions: false
  };

  handleVideoShareClicked = source => {};

  render() {
    return (
      <div className={cx(styles.container, styles.top, styles.unselectable)}>
        <div className={cx(uiStyles.uiInteractive, styles.panel, styles.left)}>
          <div
            className={cx(styles.iconButton, styles.share_screen, {
              [styles.active]: this.props.videoShareSource === "screen"
            })}
            title={this.props.videoShareSource === "screen" ? "Stop Screen Sharing" : "Share Screen"}
            onClick={() => this.handleVideoShareClicked("screen")}
          >
            <div className={cx(styles.videoShareExtraOptions)}>
              <div
                className={cx(styles.iconButton, styles.share_window, {
                  [styles.active]: this.props.videoShareSource === "window"
                })}
                title={this.props.videoShareSource === "window" ? "Stop Window Sharing" : "Share Window"}
                onClick={() => this.handleVideoShareClicked("window")}
              />
              <div
                className={cx(styles.iconButton, styles.share_window, {
                  [styles.active]: this.props.videoShareSource === "window"
                })}
                title={this.props.videoShareSource === "window" ? "Stop Window Sharing" : "Share Window"}
                onClick={() => this.handleVideoShareClicked("window")}
              />
              <div
                className={cx(styles.iconButton, styles.share_camera, {
                  [styles.active]: this.props.videoShareSource === "camera"
                })}
                title={this.props.videoShareSource === "camera" ? "Stop Camera Sharing" : "Share Camera"}
                onClick={() => this.handleVideoShareClicked("camera")}
              />
            </div>
          </div>
          <div
            className={cx(styles.iconButton, styles.mute, { [styles.active]: this.props.muted })}
            title={this.props.muted ? "Unmute Mic" : "Mute Mic"}
            onClick={this.props.onToggleMute}
          />
        </div>
        <div
          className={cx(uiStyles.uiInteractive, styles.iconButton, styles.large, styles.freeze, {
            [styles.active]: this.props.frozen
          })}
          title={this.props.frozen ? "Resume" : "Pause"}
          onClick={this.props.onToggleFreeze}
        />
        <div className={cx(uiStyles.uiInteractive, styles.panel, styles.right)}>
          <div
            className={cx(styles.iconButton, styles.spawn_pen)}
            title={"Drawing Pen"}
            onClick={this.props.onSpawnPen}
          />
          <div
            className={cx(styles.iconButton, styles.spawn_camera)}
            title={"Camera"}
            onClick={this.props.onSpawnCamera}
          />
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
      <div
        className={cx(uiStyles.uiInteractive, styles.iconButton, styles.large, styles.createObject)}
        title={"Create Object"}
        onClick={onCreateObject}
      />
    </div>
  </div>
);

BottomHUD.propTypes = {
  onCreateObject: PropTypes.func,
  showPhotoPicker: PropTypes.bool,
  onMediaPicked: PropTypes.func
};

export default { TopHUD, BottomHUD };
