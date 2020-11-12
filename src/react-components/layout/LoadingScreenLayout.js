import React from "react";
import PropTypes from "prop-types";
import styles from "./LoadingScreenLayout.scss";

export function LoadingScreenLayout({ center, bottom, logoSrc }) {
  return (
    <div className={styles.loadingScreenLayout}>
      <div className={styles.center}>
        <img className={styles.logo} src={logoSrc} />
        {center}
      </div>
      {bottom && <div className={styles.bottom}>{bottom}</div>}
    </div>
  );
}

LoadingScreenLayout.propTypes = {
  logoSrc: PropTypes.string,
  center: PropTypes.node,
  bottom: PropTypes.node
};
