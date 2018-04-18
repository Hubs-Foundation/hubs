import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import styles from "../assets/stylesheets/2d-hud.scss";

const TwoDHUD = ({ muted, frozen, onToggleMute, onToggleFreeze }) => (
  <div className={styles.container}>
    <div className={cx("ui-interactive", styles.panel, styles.left)}>
      <div className={cx(styles.iconButton, styles.mute, { [styles.active]: muted })} onClick={onToggleMute} />
    </div>
    <div
      className={cx("ui-interactive", styles.iconButton, styles.large, styles.freeze, { [styles.active]: frozen })}
      onClick={onToggleFreeze}
    />
    <div className={cx("ui-interactive", styles.panel, styles.right)}>
      <div className={cx(styles.iconButton, styles.bubble, { [styles.active]: muted })} onClick={onToggleMute} />
    </div>
  </div>
);

TwoDHUD.propTypes = {
  muted: PropTypes.bool,
  frozen: PropTypes.bool,
  onToggleMute: PropTypes.func,
  onToggleFreeze: PropTypes.func
};

export default TwoDHUD;
