import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import styles from "../assets/stylesheets/2d-hud.scss";
import uiStyles from "../assets/stylesheets/ui-root.scss";
import { WithHoverSound } from "./wrap-with-audio";

const TopHUD = ({ muted, frozen, onToggleMute, onToggleFreeze, onSpawnPen, onSpawnCamera }) => (
  <div className={cx(styles.container, styles.top, styles.unselectable)}>
    <div className={cx(uiStyles.uiInteractive, styles.panel, styles.left)}>
      <WithHoverSound>
        <div
          className={cx(styles.iconButton, styles.mute, { [styles.active]: muted })}
          title={muted ? "Unmute Mic" : "Mute Mic"}
          onClick={onToggleMute}
        />
      </WithHoverSound>
    </div>
    <WithHoverSound>
      <div
        className={cx(uiStyles.uiInteractive, styles.iconButton, styles.large, styles.freeze, {
          [styles.active]: frozen
        })}
        title={frozen ? "Resume" : "Pause"}
        onClick={onToggleFreeze}
      />
    </WithHoverSound>
    <div className={cx(uiStyles.uiInteractive, styles.panel, styles.right)}>
      <WithHoverSound>
        <div className={cx(styles.iconButton, styles.spawn_pen)} title={"Drawing Pen"} onClick={onSpawnPen} />
      </WithHoverSound>
      <WithHoverSound>
        <div className={cx(styles.iconButton, styles.spawn_camera)} title={"Camera"} onClick={onSpawnCamera} />
      </WithHoverSound>
    </div>
  </div>
);

TopHUD.propTypes = {
  muted: PropTypes.bool,
  frozen: PropTypes.bool,
  onToggleMute: PropTypes.func,
  onToggleFreeze: PropTypes.func,
  onSpawnPen: PropTypes.func,
  onSpawnCamera: PropTypes.func
};

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
