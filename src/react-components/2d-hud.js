import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import styles from "../assets/stylesheets/2d-hud.scss";

const TopHUD = ({ muted, frozen, onToggleMute, onToggleFreeze, onSpawnPen }) => (
  <div className={cx(styles.container, styles.top, styles.unselectable)}>
    <div className={cx("ui-interactive", styles.panel, styles.left)}>
      <div
        className={cx(styles.iconButton, styles.mute, { [styles.active]: muted })}
        title={muted ? "Unmute Mic" : "Mute Mic"}
        onClick={onToggleMute}
      />
    </div>
    <div
      className={cx("ui-interactive", styles.iconButton, styles.large, styles.freeze, { [styles.active]: frozen })}
      title={frozen ? "Resume" : "Pause"}
      onClick={onToggleFreeze}
    />
    <div className={cx("ui-interactive", styles.panel, styles.right)}>
      <div className={cx(styles.iconButton, styles.spawn_pen)} title={"Drawing Pen"} onClick={onSpawnPen} />
    </div>
  </div>
);

TopHUD.propTypes = {
  muted: PropTypes.bool,
  frozen: PropTypes.bool,
  onToggleMute: PropTypes.func,
  onToggleFreeze: PropTypes.func,
  onSpawnPen: PropTypes.func
};

const BottomHUD = ({ onCreateObject, showPhotoPicker, onMediaPicked }) => (
  <div className={cx(styles.container, styles.column, styles.bottom, styles.unselectable)}>
    {showPhotoPicker ? (
      <div className={cx("ui-interactive", styles.panel, styles.up)}>
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
        className={cx("ui-interactive", styles.iconButton, styles.large, styles.createObject)}
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
