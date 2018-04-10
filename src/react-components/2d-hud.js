import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import styles from "../assets/stylesheets/2d-hud.css";

const TwoDHUD = ({ name, muted, onToggleMute }) => (
  <div className={styles.container}>
    <div className={cx("ui-interactive", styles.panel, styles.left)}>
      <div className={cx(styles.mic, { [styles.muted]: muted })} onClick={onToggleMute} />
    </div>
    <div className={cx("ui-interactive", styles.modeButton)}>
      <div className={styles.avatar} />
    </div>
    <div className={cx("ui-interactive", styles.panel, styles.right)}>
      <div className={cx(styles.mic, { [styles.muted]: muted })} onClick={onToggleMute} />
    </div>
  </div>
);

TwoDHUD.propTypes = {
  name: PropTypes.string,
  muted: PropTypes.bool,
  onToggleMute: PropTypes.func
};

export default TwoDHUD;
