import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import styles from "./2d-hud.css";

const TwoDHUD = ({ name, muted, onToggleMute }) => (
  <div className={styles.container}>
    <div className={cx("ui-interactive", styles.bg)}>
      <div className={cx(styles.mic, { [styles.muted]: muted })} onClick={onToggleMute} />
      <div className={styles.nametag}>{name}</div>
      <div className={styles.avatar} />
    </div>
  </div>
);

TwoDHUD.propTypes = {
  name: PropTypes.string,
  muted: PropTypes.bool,
  onToggleMute: PropTypes.func
};

export default TwoDHUD;
