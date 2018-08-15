import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import styles from "../assets/stylesheets/2d-hud.scss";

const TopHUD = ({ muted, frozen, spacebubble, onToggleMute, onToggleFreeze, onToggleSpaceBubble }) => (
  <div className={cx(styles.container, styles.top)}>
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
      <div
        className={cx(styles.iconButton, styles.bubble, { [styles.active]: spacebubble })}
        title={spacebubble ? "Disable Bubble" : "Enable Bubble"}
        onClick={onToggleSpaceBubble}
      />
    </div>
  </div>
);

TopHUD.propTypes = {
  muted: PropTypes.bool,
  frozen: PropTypes.bool,
  spacebubble: PropTypes.bool,
  onToggleMute: PropTypes.func,
  onToggleFreeze: PropTypes.func,
  onToggleSpaceBubble: PropTypes.func
};

const BottomHUD = ({ onCreateObject }) => (
  <div className={cx(styles.container, styles.bottom)}>
    <div
      className={cx("ui-interactive", styles.iconButton, styles.large, styles.createObject)}
      title={"Create Object"}
      onClick={onCreateObject}
    />
  </div>
);

BottomHUD.propTypes = {
  onCreateObject: PropTypes.func
};

export default { TopHUD, BottomHUD };
